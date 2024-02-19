#!/usr/bin/env node

/*
 * Copyright (C) 2023 Amazon.com, Inc. or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';

import { Construct } from 'constructs';
import { CacheStorage } from '@project-lakechain/core';
import { S3EventTrigger } from '@project-lakechain/s3-event-trigger';
import { Condition, CloudEvent } from '@project-lakechain/condition';
import { S3StorageConnector } from '@project-lakechain/s3-storage-connector';
import { when } from '@project-lakechain/core/dsl';

/**
 * An example stack showcasing how to use conditionals using
 * the `Condition` middleware to express complex conditions
 * within a pipeline.
 *
 * The pipeline looks as follows:
 *
 * ┌──────────────┐   ┌──────────────────────────┐   ┌──────┐
 * │   S3 Input   ├──►│  Conditional Expression  ├──►|  S3  │
 * └──────────────┘   └──────────────────────────┘   └──────┘
 *
 */
export class ConditionalPipelineStack extends cdk.Stack {

  /**
   * Stack constructor.
   */
  constructor(scope: Construct, id: string, env: cdk.StackProps) {
    super(scope, id, {
      description: 'A pipeline demonstrating how to use conditionals in pipelines.',
      ...env
    });

    ///////////////////////////////////////////
    ///////         S3 Storage          ///////
    ///////////////////////////////////////////

    // The source bucket.
    const source = new s3.Bucket(this, 'Bucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      enforceSSL: true
    });

    // The destination bucket.
    const destination = new s3.Bucket(this, 'Destination', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      enforceSSL: true
    });

    // The cache storage.
    const cache = new CacheStorage(this, 'Cache', {});

    ///////////////////////////////////////////
    ///////     Lakechain Pipeline      ///////
    ///////////////////////////////////////////

    // Create the S3 trigger monitoring the bucket
    // for uploaded objects.
    const trigger = new S3EventTrigger.Builder()
      .withScope(this)
      .withIdentifier('Trigger')
      .withCacheStorage(cache)
      .withBucket(source)
      .build();

    // We combine a filter to only keep JSON documents,
    // and the `Condition` middleware to check if the
    // document matches the expected structure.
    const condition = new Condition.Builder()
      .withScope(this)
      .withIdentifier('Condition')
      .withCacheStorage(cache)
      // Only listen for JSON documents.
      .withSource(trigger, when('data.document.type').equals('application/json'))
      // 👇 The below expression will be executed in the Cloud at runtime.
      .withConditional(async (event: CloudEvent) => {
        const document = event.data().document();

        // Load the document in memory.
        const data = JSON.parse(
          (await document.data().asBuffer()).toString('utf-8')
        );

        return (data.version === '1.0.0');
      })
      .build();

    // If the condition is met, we store the document in the
    // destination bucket.
    condition.onMatch(
      new S3StorageConnector.Builder()
        .withScope(this)
        .withIdentifier('Storage')
        .withCacheStorage(cache)
        .withDestinationBucket(destination)
        .build()
    );

    // Display the source bucket information in the console.
    new cdk.CfnOutput(this, 'SourceBucketName', {
      description: 'The name of the source bucket.',
      value: source.bucketName
    });

    // Display the destination bucket information in the console.
    new cdk.CfnOutput(this, 'DestinationBucketName', {
      description: 'The name of the destination bucket.',
      value: destination.bucketName
    });
  }
}

// Creating the CDK application.
const app = new cdk.App();

// Environment variables.
const account = process.env.CDK_DEFAULT_ACCOUNT ?? process.env.AWS_DEFAULT_ACCOUNT;
const region  = process.env.CDK_DEFAULT_REGION ?? process.env.AWS_DEFAULT_REGION;

// Deploy the stack.
new ConditionalPipelineStack(app, 'ConditionalPipelineStack', {
  env: {
    account,
    region
  }
});
