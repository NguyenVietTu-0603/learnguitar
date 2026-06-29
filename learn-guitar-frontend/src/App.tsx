import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './router/AppRoutes';
import MainLayout from './layouts/MainLayout';
import './styles/guitarvn.css';
import './styles/auth.css';
import './styles/shared.css';
import './styles/song.css';
import './styles/chord-detail-page.css';
import './styles/video-quiz.css';
import './styles/tab-image.css';
import './layouts/AdminLayout.css';


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MainLayout>
          <AppRoutes />
        </MainLayout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
