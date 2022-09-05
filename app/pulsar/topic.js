/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

'use strict';

const { Producer, Consumer, logLevel } = require('pulsar-flex')
const uuid = require('uuid');

class TopicController {
    async healthCheck(req, res) {
        let tenant = req.params.tenant;
        let namespace = req.params.namespace;
        let host = req.body.host;
        let port = req.body.port;
        let randomTopic= uuid.v4();
        const producer = new Producer({
            topic: `persistent://${tenant}/${namespace}/${randomTopic}`,
            discoveryServers: [`${host}:${port}`],
            producerAccessMode: Producer.ACCESS_MODES.SHARED,
            logLevel: logLevel.INFO
        })
        const consumer = new Consumer({
            topic: `persistent://${tenant}/${namespace}/${randomTopic}`,
            discoveryServers: [`${host}:${port}`],
            subType: Consumer.SUB_TYPES.EXCLUSIVE,
            consumerName: 'proxy-health-check',
            subscription: 'proxy-health-check',
            receiveQueueSize: 1000,
            logLevel: logLevel.INFO,
        })
        await consumer.subscribe()
        await producer.create()
        let randomMessage = uuid.v4();
        await producer.sendMessage({ payload: randomMessage})
        let receiveMessage;
        await new Promise((resolve, reject) => {
            consumer.run({
                onMessage: ({ message, properties }) => {
                    receiveMessage = message.toString();
                    resolve();
                },
            });
        });
        await producer.close()
        await consumer.unsubscribe()
        if (receiveMessage === randomMessage) {
            res.status(200).send('Success');
        } else {
            res.status(500).send('Failed');
        }
    }
}

const topicController = new TopicController();

module.exports = {topicController}
