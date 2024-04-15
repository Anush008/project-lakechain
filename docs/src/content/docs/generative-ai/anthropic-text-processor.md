---
title: Anthropic
---

<span title="Label: Pro" data-view-component="true" class="Label Label--api text-uppercase">
  Unstable API
</span>
<span title="Label: Pro" data-view-component="true" class="Label Label--version text-uppercase">
  0.7.0
</span>
<span title="Label: Pro" data-view-component="true" class="Label Label--package">
  <a target="_blank" href="https://www.npmjs.com/package/@project-lakechain/bedrock-text-processors">
    @project-lakechain/bedrock-text-processors
  </a>
</span>
<span class="language-icon">
  <svg role="img" viewBox="0 0 24 24" width="30" xmlns="http://www.w3.org/2000/svg" style="fill: #3178C6;"><title>TypeScript</title><path d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 27.72 27.72 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 7.536 7.536 0 0 1 1.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z"/></svg>
</span>
<div style="margin-top: 26px"></div>

---

*Bedrock text processors expose different constructs that leverage the Generative AI text models powered by [Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/what-is-bedrock.html). Using these constructs, you can use prompt engineering techniques to transform text documents, including, text summarization, text translation, information extraction, and more!*

The Anthropic text processor is part of the Bedrock text processors and allows you to leverage machine-learning models provided by Anthropic within your pipelines.

---

### 🤖 Text Generation

To start using Anthropic models in your pipelines, you import the `AnthropicTextProcessor` construct in your CDK stack, and specify the specific text model you want to use.

> 💁 The below example demonstrates how to use the Anthropic text processor to summarize input documents uploaded to an S3 bucket.

```typescript
import { S3EventTrigger } from '@project-lakechain/s3-event-trigger';
import { AnthropicTextProcessor, AnthropicTextModel } from '@project-lakechain/bedrock-text-processors';
import { CacheStorage } from '@project-lakechain/core';

class Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string) {
    const cache = new CacheStorage(this, 'Cache');

    // Monitor the S3 bucket for new documents.
    const trigger = new S3EventTrigger.Builder()
      .withScope(this)
      .withIdentifier('Trigger')
      .withCacheStorage(cache)
      .withBucket(bucket)
      .build();

    // Transforms input documents using an Anthropic model.
    const anthropic = new AnthropicTextProcessor.Builder()
      .withScope(this)
      .withIdentifier('AnthropicTextProcessor')
      .withCacheStorage(cache)
      .withSource(trigger)
      .withModel(AnthropicTextModel.ANTHROPIC_CLAUDE_V3_HAIKU)
      .withPrompt(`
        Give a detailed summary of the text with the following constraints:
        - Write the summary in the same language as the original text.
        - Keep the original meaning, style, and tone of the text in the summary.
      `)
      .withModelParameters({
        temperature: 0.5,
        max_tokens: 4096
      })
      .build();
  }
}
```

> ℹ️ **Tip** - Note that the Claude v3 family of models is multi-modal, and supports both text and image documents as an input.

<br>

---

### 🧩 Composite Events

In addition to handling single documents, the Anthropic text processor also supports [composite events](/project-lakechain/general/events#-composite-events) as an input. This means that it can take multiple text and image documents and compile them into a single input for the model.

This can come in handy in map-reduce pipelines where you use the [Reducer]() to combine multiple documents into a single input having a similar semantic, for example, multiple pages of a PDF document that you would like the model to summarize as a whole, while keeping the context between the pages.

<br>

---

### 🤖 Model Selection

You can select the specific Anthropic model to use with this middleware using the `.withModel` API.

```typescript
import { AnthropicTextProcessor, AnthropicTextModel } from '@project-lakechain/bedrock-text-processors';

const anthropic = new AnthropicTextProcessor.Builder()
  .withScope(this)
  .withIdentifier('AnthropicTextProcessor')
  .withCacheStorage(cache)
  .withSource(source)
  .withModel(AnthropicTextModel.ANTHROPIC_CLAUDE_V3_SONNET) // 👈 Model selection
  .withPrompt(prompt)
  .build();
```

You can choose amongst the following models : `ANTHROPIC_CLAUDE_INSTANT_V1`, `ANTHROPIC_CLAUDE_V2`, `ANTHROPIC_CLAUDE_V2_1`, `ANTHROPIC_CLAUDE_V3_HAIKU`, `ANTHROPIC_CLAUDE_V3_SONNET`.

<br>

---

### 🌐 Region Selection

You can specify the AWS region in which you want to invoke Amazon Bedrock using the `.withRegion` API. This can be helpful if Amazon Bedrock is not yet available in your deployment region.

> 💁 By default, the middleware will use the current region in which it is deployed.

```typescript
import { AnthropicTextProcessor, AnthropicTextModel } from '@project-lakechain/bedrock-text-processors';

const anthropic = new AnthropicTextProcessor.Builder()
  .withScope(this)
  .withIdentifier('AnthropicTextProcessor')
  .withCacheStorage(cache)
  .withSource(source)
  .withRegion('eu-central-1') // 👈 Alternate region
  .withModel(AnthropicTextModel.ANTHROPIC_CLAUDE_V3_HAIKU)
  .withPrompt(prompt)
  .build();
```

<br>

---

### ⚙️ Model Parameters

You can forward specific parameters to the text models using the `.withModelParameters` method. Below is a description of the supported parameters.

Parameter   | Description | Min | Max | Default
----------- | ----------- | --- | --- | -------
temperature | Controls the randomness of the generated text. | 0 | 1 | N/A
max_tokens  | The maximum number of tokens to generate. | 1 | 4096 | 4096
top_p       | The cumulative probability of the top tokens to sample from. | 0 | 1 | N/A
top_k       | The number of top tokens to sample from. | 1 | 100000000 | N/A

<br>

---

### 🏗️ Architecture

This middleware is based on a Lambda compute running on an ARM64 architecture, and integrate with Amazon Bedrock to generate text based on the given prompt and input documents.

![Architecture](../../../assets/bedrock-text-generators-architecture.png)

<br>

---

### 🏷️ Properties

<br>

##### Supported Inputs

The supported inputs depend on the selected model as the Claude v3 models are multi-modal and support text and images, while the Claude v2 model only support text. The following table lists the supported inputs for each model.

| Model                        | Supported Inputs
| ---------------------------- | ----------------
| `ANTHROPIC_CLAUDE_INSTANT_V1` | Text
| `ANTHROPIC_CLAUDE_V2`         | Text
| `ANTHROPIC_CLAUDE_V2_1`       | Text
| `ANTHROPIC_CLAUDE_V3_HAIKU`   | Text, Image
| `ANTHROPIC_CLAUDE_V3_SONNET`  | Text, Image

###### Text Inputs

Below is a list of supported text inputs.

|  Mime Type                   | Description
| ---------------------------- | -----------
| `text/plain`                 | UTF-8 text documents.
| `text/markdown`              | Markdown documents.
| `text/csv`                   | CSV documents.
| `text/html`                  | HTML documents.
| `application/x-subrip`       | SubRip subtitles.
| `text/vtt`                   | Web Video Text Tracks (WebVTT) subtitles.
| `application/json`           | JSON documents.
| `application/xml`            | XML documents.

###### Image Inputs

Below is a list of supported image inputs.

|  Mime Type                   | Description
| ---------------------------- | -----------
| `image/jpeg`                 | JPEG images.
| `image/png`                  | PNG images.
| `image/gif`                  | GIF images.
| `image/webp`                 | WebP images.

###### Composite Inputs

The middleware also supports composite events as an input, which can be used to combine multiple text and image documents into a single input for the model.

|  Mime Type                     | Description
| ------------------------------ | -----------
| `application/cloudevents+json` | Composite events emitted by the `Reducer`.

##### Supported Outputs

|  Mime Type  | Description |
| ----------- | ----------- |
| `text/plain` | UTF-8 text documents. |

##### Supported Compute Types

| Type  | Description |
| ----- | ----------- |
| `CPU` | This middleware only supports CPU compute. |

<br>

---

### 📖 Examples

- [Bedrock Summarization Pipeline](https://github.com/awslabs/project-lakechain/tree/main/examples/simple-pipelines/summarization-pipelines/bedrock-summarization-pipeline) - Builds a pipeline for text summarization using Amazon Bedrock.
- [Audio Recording Summarization Pipeline](https://github.com/awslabs/project-lakechain/tree/main/examples/simple-pipelines/summarization-pipelines/audio-recording-summarization-pipeline) - Builds a pipeline for summarizing audio recordings using Amazon Transcribe and Amazon Bedrock.
- [Video Summarization Pipeline](https://github.com/awslabs/project-lakechain/tree/main/examples/simple-pipelines/summarization-pipelines/video-summarization-pipeline) - Builds a pipeline for video summarization.
