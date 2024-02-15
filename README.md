<br><br>

<p align="center">
  <img width="240" src="docs/src/assets/icon.png">
  <br><br>
  <h2 align="center">Project Lakechain &nbsp;<img alt="Static Badge" src="https://img.shields.io/badge/Alpha-e28743"></h2>
  <p align="center">Cloud-native, AI-powered, document processing pipelines on AWS.</p>
  <p align="center">
    <a href="https://codespaces.new/awslabs/project-lakechain"><img alt="Github Codespaces" src="https://github.com/codespaces/badge.svg" /></a>
  </p>
</p>
<br>

## 🔖 Features

- 🤖 **Composable** — Composable API to express document processing pipelines using middlewares.
- ☁️ **Scalable** — Scales out-of-the box. Process millions of documents, scale to zero automatically when done.
- ⚡ **Cost Efficient** — Uses cost-optimized architectures to reduce costs and drive a pay-as-you-go model.
- 🚀 **Ready to use** — **40+** built-in middlewares for common document processing tasks, ready to be deployed.
- 🦎 **GPU and CPU Support** — Use the right compute type to balance between performance and cost.
- 📦 **Bring Your Own** — Create your own transform middlewares to process documents and extend Lakechain.
- 📙 **Ready Made Examples** - Quickstart your journey by leveraging [40+ examples](./examples/) we've built for you.

## 🚀 Getting Started

> 👉 Head to our [documentation](https://awslabs.github.io/project-lakechain/) which contains all the information required to understand the project, and quickly start building!

## What's Lakechain ❓

Project Lakechain is an experimental framework based on the [AWS Cloud Development Kit (CDK)](https://github.com/aws/aws-cdk) that makes it easy to express and deploy scalable document processing pipelines on AWS using infrastructure-as-code. It emphasizes on modularity of pipelines, and provides **40+** ready to use components for prototyping complex document pipelines that can scale out of the box to millions of documents.

This project has been designed to help AWS customers build and scale different types of document processing pipelines, ranging a wide array of use-cases including *metadata extraction*, *document conversion*, *NLP analysis*, *text summarization*, *translations*, *audio transcriptions*, *computer vision*, *[Retrieval Augmented Generation](https://docs.aws.amazon.com/sagemaker/latest/dg/jumpstart-foundation-models-customize-rag.html) pipelines*, and much more!

## Show me the code ❗

Below is an example of a pipeline that deploys the infrastructure required to automatically transcribe audio files uploaded to S3, in just a few lines of code.

> 👇 This pipeline will scale to millions of documents.

```typescript
export class TranscriptionStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {

    // Listen for new documents on S3.
    const trigger = new S3EventTrigger.Builder()
      .withScope(this)
      .withIdentifier('Trigger')
      .withCacheStorage(cache)
      .withBucket(bucket)
      .build();

    trigger
      // Transcribe audio documents with Amazon Transcribe.
      .pipe(new TranscribeAudioProcessor.Builder()
        .withScope(this)
        .withIdentifier('Transcribe')
        .withCacheStorage(cache)
        .build()
      )
      // Store transcription results in S3.
      .pipe(new S3StorageConnector.Builder()
        .withScope(this)
        .withIdentifier('Storage')
        .withCacheStorage(cache)
        .withDestinationBucket(destination)
        .build()
      );
  }
}
```

## LICENSE

See [LICENSE](LICENSE).
