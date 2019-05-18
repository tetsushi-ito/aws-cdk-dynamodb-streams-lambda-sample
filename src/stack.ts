import * as cdk from '@aws-cdk/cdk';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';

import { readFileContent } from './helpers';

export class Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const serviceName = id;
    const stage = this.node.getContext('stage') || 'dev';
    // const region = this.node.getContext('region') || 'ap-northeast-1';

    const dynamodbTable = new dynamodb.CfnTable(this, 'DynamoDBTable', {
      tableName: `${serviceName}-${stage}-SampleTable`,
      billingMode: dynamodb.BillingMode.PayPerRequest,
      keySchema: [{ attributeName: 'id', keyType: 'HASH' }],
      attributeDefinitions: [
        {
          attributeName: 'id',
          attributeType: dynamodb.AttributeType.String,
        },
      ],
      streamSpecification: {
        streamViewType: 'NEW_AND_OLD_IMAGES',
      },
    });

    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        CloudWatchWritePolicy: new iam.PolicyDocument().addStatement(
          new iam.PolicyStatement()
            .allow()
            .addAction('logs:CreateLogGroup')
            .addAction('logs:CreateLogStream')
            .addAction('logs:PutLogEvents')
            .addAllResources(),
        ),
        DynamoDbAccessPolicy: new iam.PolicyDocument().addStatement(
          new iam.PolicyStatement()
            .allow()
            .addAction('dynamodb:*')
            .addAllResources(),
        ),
      },
    });

    const lambdaFunction = new lambda.Function(this, 'LambdaFunction', {
      functionName: `${serviceName}-${stage}-DynamoDBStreamsHandler`,
      handler: 'index.handler',
      runtime: lambda.Runtime.NodeJS810,
      role: lambdaRole,
      code: new lambda.InlineCode(
        readFileContent(__dirname, 'resources/lambda/function.js'),
      ),
    });

    new lambda.EventSourceMapping(this, 'LambdaEventSourceMapping', {
      eventSourceArn: dynamodbTable.tableStreamArn,
      target: lambdaFunction,
      startingPosition: lambda.StartingPosition.Latest,
    });
  }
}
