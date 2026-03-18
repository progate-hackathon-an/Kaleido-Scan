import { RotationGuard } from './components/RotationGuard';
import { ScanPage } from './pages/ScanPage';

function App() {
  return (
    <>
      <RotationGuard />
      <ScanPage />
    </>
  );
}

export default App;
