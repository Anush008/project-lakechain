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
 * WITHOUT WARRANTIES OR ReducerS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';

import { Construct } from 'constructs';
import { ServiceDescription } from '@project-lakechain/core/service';
import { CacheStorage } from '@project-lakechain/core';
import { ComputeType } from '@project-lakechain/core/compute-type';
import { ReducerStrategy } from './definitions/strategies/strategy';
import { when } from '@project-lakechain/core/dsl';
import { TimeWindowStrategyConstruct } from './impl/time-window-strategy';
import { StaticCounterStrategyConstruct } from './impl/static-counter-strategy';
import { ConditionalStrategyConstruct } from './impl/conditional-strategy';

import {
  ReducerProps,
  ReducerPropsSchema
} from './definitions/opts';
import {
  Middleware,
  MiddlewareBuilder
} from '@project-lakechain/core/middleware';

/**
 * The service description.
 */
const description: ServiceDescription = {
  name: 'reducer',
  description: 'A middleware allowing to reduce multiple events into a single event.',
  version: '0.10.0',
  attrs: {}
};

/**
 * The maximum time the processing lambda
 * is allowed to run.
 */
const PROCESSING_TIMEOUT = cdk.Duration.seconds(10);

/**
 * Builder for the `Reducer` middleware.
 */
class ReducerBuilder extends MiddlewareBuilder {
  private providerProps: Partial<ReducerProps> = {};

  /**
   * Specifies a reducer strategy to be used to aggregate
   * events.
   * @param strategy the strategy instance to use.
   * @returns the builder instance.
   */
  public withReducerStrategy(strategy: ReducerStrategy) {
    this.providerProps.strategy = strategy;
    return (this);
  }
  
  /**
   * @returns a new instance of the `Reducer`
   * service constructed with the given parameters.
   */
  public build(): Reducer {
    return (new Reducer(
      this.scope,
      this.identifier, {
        ...this.providerProps as ReducerProps,
        ...this.props
      }
    ));
  }
}

/**
 * A middleware acting as a reducer for events.
 */
export class Reducer extends Middleware {

  /**
   * The storage containing processed files.
   */
  public storage: CacheStorage;

  /**
   * The builder for the `Reducer` service.
   */
  public static readonly Builder = ReducerBuilder;

  /**
   * Provider constructor.
   */
  constructor(scope: Construct, id: string, props: ReducerProps) {
    super(scope, id, description, {
      ...props,
      queueVisibilityTimeout: cdk.Duration.seconds(
        3 * PROCESSING_TIMEOUT.toSeconds()
      )
    });

    // Validating the properties.
    props = this.parse(ReducerPropsSchema, props);

    ///////////////////////////////////////////
    ///////    Processing Storage      ////////
    ///////////////////////////////////////////

    this.storage = new CacheStorage(this, 'Storage', {
      encryptionKey: props.kmsKey
    });

    ///////////////////////////////////////////
    /////////    Reducer Strategy      ////////
    ///////////////////////////////////////////

    if (props.strategy.name() === 'TIME_WINDOW') {
      new TimeWindowStrategyConstruct(this, 'TimeWindowStrategy', this, props);
    } else if (props.strategy.name() === 'STATIC_COUNTER') {
      new StaticCounterStrategyConstruct(this, 'StaticCounterStrategy', this, props);
    } else if (props.strategy.name() === 'CONDITIONAL') {
      new ConditionalStrategyConstruct(this, 'ConditionalStrategy', this, props);
    } else {
      throw new Error(`Unsupported reducer strategy: ${props.strategy.name()}`);
    }

    super.bind();
  }

  /**
   * Allows a grantee to read from the processed documents
   * generated by this middleware.
   */
  grantReadProcessedDocuments(grantee: iam.IGrantable): iam.Grant {
    // Since this middleware simply passes through the data
    // from the previous middleware, we grant any subsequent
    // middlewares in the pipeline to have read access to the
    // data of all source middlewares.
    for (const source of this.sources) {
      source.grantReadProcessedDocuments(grantee);
    }
    this.storage.grantRead(grantee);
    return ({} as iam.Grant);
  }

  /**
   * @returns an array of mime-types supported as input
   * type by the data producer.
   */
  supportedInputTypes(): string[] {
    return ([
      '*/*'
    ]);
  }

  /**
   * @returns an array of mime-types supported as output
   * type by the data producer.
   */
  supportedOutputTypes(): string[] {
    return ([
      'application/cloudevents+json'
    ]);
  }

  /**
   * @returns the supported compute types by a given
   * middleware.
   */
  supportedComputeTypes(): ComputeType[] {
    return ([
      ComputeType.CPU
    ]);
  }

  /**
   * @returns the middleware conditional statement defining
   * in which conditions this middleware should be executed.
   * In this case, we want the middleware to only be invoked
   * when the document mime-type is supported, and the event
   * type is `document-created`.
   */
  conditional() {
    return (super
      .conditional()
      .and(when('type').equals('document-created'))
    );
  }
}

export * from './definitions/strategies';
export { CloudEvent } from '@project-lakechain/sdk';
