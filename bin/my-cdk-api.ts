import * as cdk from 'aws-cdk-lib';

const app = new cdk.App();
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

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
    });

    // CloudWatch alarm — triggers if Lambda errors spike
    new cloudwatch.Alarm(this, 'ErrorAlarm', {
      metric: fn.metricErrors(),
      threshold: 5,
      evaluationPeriods: 1,
      alarmDescription: 'Lambda error rate too high',
    });

    // Output the API URL
    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url });
  }
}

new MyCdkApiStack(app, 'MyCdkApiStack', {
  env: { account: '455132698673', region: 'eu-north-1' }
});