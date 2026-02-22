import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

const jaegerEndpoint = process.env['JAEGER_ENDPOINT'] ?? 'http://localhost:14268/api/traces';

const sdk = new NodeSDK({
  serviceName: 'api-gateway',
  traceExporter: new JaegerExporter({
    endpoint: jaegerEndpoint,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('OpenTelemetry SDK shut down'))
    .catch((err: unknown) => console.error('Error shutting down OpenTelemetry', err));
});

export { sdk };
