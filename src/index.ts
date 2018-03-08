
export class ServerlessPluginManageCloudWatch {
	private serverless;
	private options;
	private commands;
	private hooks;

	private cloudWatch;

	constructor(serverless, options) {
		this.serverless = serverless;
		this.options = options;

		this.commands = {
			cloudwatch: {
				usage: 'Manage AWS CloudWatch LogGroups for centralized logging',
				lifecycleEvents: ['cloudwatch'],

				commands: {
					list: {
						usage: 'Lists AWS CloudWatch LogGroups for this Serverless project',
						lifecycleEvents: ['start'],
					},

					register: {
						usage: '(Re-)Register CloudWatch subscription filters',
						lifecycleEvents: ['start'],
					},

					release: {
						usage: 'Release CloudWatch subscription filters',
						lifecycleEvents: ['start'],
					},

					retention: {
						usage: 'Set log retention time',
						lifecycleEvents: ['start'],
					}
				}
			}
		};

		this.hooks = {
			'cloudwatch:list:start': this.listCloudWatch.bind(this),
			'cloudwatch:register:start': this.registerSubscriptions.bind(this),
			'cloudwatch:release:start': this.releaseSubscriptions.bind(this),
			'cloudwatch:retention:start': this.setupLogRetention.bind(this),
		};
	}

	initialize() {
		if (this.cloudWatch) return;

		this.cloudWatch = new this.serverless.providers.aws.sdk.CloudWatchLogs({
			region: this.serverless.service.provider.region,
		});
	}

	async listCloudWatch() {
		this.initialize();
		this.serverless.cli.log('AWS CloudWatch LogGroups');

		for (let group of (await this.describeLogGroups()).logGroups) {
			this.serverless.cli.log('* LogGroup ' + group.logGroupName);
			this.serverless.cli.log('  Created ' + new Date(group.creationTime).toISOString());
			this.serverless.cli.log('  Retention days: ' + group.retentionInDays);

			for (let filter of (await this.describeCloudWatchSubscriptionFor(group)).subscriptionFilters) {
				this.serverless.cli.log('  + Filter: ' + filter.filterName);
				this.serverless.cli.log('    Destination: ' + filter.destinationArn);
				this.serverless.cli.log('    Pattern: ' + filter.filterPattern);
			}

			this.serverless.cli.log('');
		}
	}

	async registerSubscriptions() {
		this.initialize();

		console.log(this.serverless.service.functions);

		for (let name in this.serverless.service.functions) {
			console.log(name);
		}
	}

	async releaseSubscriptions() {
		this.initialize();
	}

	async setupLogRetention() {
		this.initialize();
	}

	async describeLogGroups(): Promise<any> {
		let params = {
			logGroupNamePrefix: '/aws/lambda/' + this.serverless.service.service + '-' + this.serverless.service.provider.stage + '-',
		};

		return new Promise((resolve, reject) => this.cloudWatch.describeLogGroups(params, (err, res) => {
			if (err) {
				reject(err);
			} else {
				resolve(res);
			}
		}));
	}

	async describeCloudWatchSubscriptionFor(logGroup): Promise<any> {
		let params = {
			logGroupName: logGroup.logGroupName,
		};

		return new Promise((resolve, reject) => this.cloudWatch.describeSubscriptionFilters(params, (err, res) => {
			if (err) {
				reject(err);
			} else {
				resolve(res);
			}
		}));
	}
}

module.exports = ServerlessPluginManageCloudWatch;