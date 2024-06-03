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

import { SQSEvent, Context, SQSRecord } from 'aws-lambda';
import { logger, tracer } from '@project-lakechain/sdk/powertools';
import { LambdaInterface } from '@aws-lambda-powertools/commons';
import { CloudEvent } from '@project-lakechain/sdk/models';
import neo4j from 'neo4j-driver';
import { createClient } from './client';

import {
  BatchProcessor,
  EventType,
  processPartialResponse
} from '@aws-lambda-powertools/batch';

/**
 * The async batch processor processes the received
 * events from SQS in parallel.
 */
const processor = new BatchProcessor(EventType.SQS);

/**
 * Lambda class definition containing the lambda handler.
 */
class Lambda implements LambdaInterface {

  /**
   * Writes the document graph in the Neo4j database.
   * @param record the SQS record associated with
   * the received document.
   * @returns a promise resolved when the document graph
   * has been written in the database.
   */
  async recordHandler(record: SQSRecord): Promise<void> {
    const event  = CloudEvent.from(JSON.parse(record.body));
    const graph  = await event.asGraph();
    const client = await createClient();
    const session = client.session({ defaultAccessMode: neo4j.session.WRITE });

    try {
      await session.executeWrite(async (tx) => {
        
        // Write the nodes.
        for (const node of graph.nodes()) {
          const props = graph.getNodeAttributes(node);
          await tx.run(
            `MERGE (n:${props.type} { id: $id }) SET n += $props`,
            { id: node, props: props.attrs }
          );
        }

        // Write the edges.
        for (const edge of graph.edges()) {
          const source = graph.source(edge);
          const target = graph.target(edge);
          const attrs = graph.getEdgeAttributes(edge);
          await tx.run(
            `MATCH (a { id: $source }), (b { id: $target }) MERGE (a)-[r:${attrs.type}]->(b)`,
            { source, target, ...attrs }
          );
        }
      }, { timeout: 10000 });
    } finally {
      await session.close();
      await client.close();
    }
  }

  /**
   * The Lambda entry point.
   * @param event the received SQS event.
   * @param _ the Lambda context.
   */
  @tracer.captureLambdaHandler()
  @logger.injectLambdaContext()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handler(event: SQSEvent, _: Context) {
    return (await processPartialResponse(
      event, this.recordHandler.bind(this), processor
    ));
  }
}

// The Lambda handler class.
const handlerClass = new Lambda();

// The handler function.
export const handler = handlerClass.handler.bind(handlerClass);
