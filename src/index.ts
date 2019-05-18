#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/cdk';
import { Stack } from './stack';

const app = new cdk.App();

const appName = 'dynamodblambdatrigger';
const stage = app.node.getContext('stage') || 'dev';

new Stack(app, appName, {
  stackName: `${appName}-${stage}`,
});

app.run();
