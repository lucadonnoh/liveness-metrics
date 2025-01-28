import LivenessChart from '../components/LivenessChart';

const PROJECTS = ['arbitrum', 'base', 'optimism', 'zksync2', 'starknet', 'blast', 'linea', 'worldchain', 'scroll', 'zircuit', 'swell', 'bob', 'taiko', 'mode', 'lisk', 'fuel', 'ink', 'polygonzkevm', 'degate3', 'kinto', 'zksync', 'loopring', 'soneium', 'paradex', 'zora', 'bobanetwork', 'kroma', 'polynomial', 'zeronetwork', 'hashkey'];
const METRIC_TYPE = 'stateUpdates'; // or make this configurable

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            L2BEAT Liveness Metrics - {METRIC_TYPE}
          </h1>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PROJECTS.map((project) => (
              <LivenessChart
                key={project}
                projectName={project}
                metricType={METRIC_TYPE}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
