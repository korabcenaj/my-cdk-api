import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';

const app = new cdk.App();

export class MyCdkApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB table
    const table = new dynamodb.Table(this, 'ItemsTable', {
      tableName: 'items',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // free tier friendly
      removalPolicy: cdk.RemovalPolicy.DESTROY, // clean up on cdk destroy
    });

    // Lambda function
    const fn = new NodejsFunction(this, 'ApiHandler', {
      entry: 'lambda/handler.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    // Grant Lambda read/write access to DynamoDB (least-privilege IAM)
    table.grantReadWriteData(fn);

    // API Gateway
    const api = new apigw.LambdaRestApi(this, 'ItemsApi', {
      handler: fn,
      restApiName: 'Items API',
      proxy: false,  // disable catch-all so we can define routes explicitly
    });
    

    const items = api.root.addResource('items');
    items.addMethod('GET');
    items.addMethod('POST');

    const item = items.addResource('{id}');
    item.addMethod('PUT');
    item.addMethod('DELETE');
    // CloudWatch alarm — triggers if Lambda errors spike

    const alertTopic = new sns.Topic(this, 'BillingAlertTopic');
      alertTopic.addSubscription(
      new subscriptions.EmailSubscription('YOUR_EMAIL@gmail.com')
    );

    new cloudwatch.Alarm(this, 'BillingAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Billing',
        metricName: 'EstimatedCharges',
        dimensionsMap: { Currency: 'USD' },
        statistic: 'Maximum',
        period: cdk.Duration.hours(6),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: 'AWS bill exceeded $1',
      actionsEnabled: true,
    }).addAlarmAction(new actions.SnsAction(alertTopic));

    // Output the API URL
    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url });
  }
}

new MyCdkApiStack(app, 'MyCdkApiStack', {
  env: { account: '455132698673', region: 'eu-north-1' }
});