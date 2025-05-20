import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import { UserRole } from '@/types';

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  
  return (
    <header>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <Link href="/" className="navbar-brand">
            Project Management
          </Link>
          
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              {session && (
                <>
                  <li className="nav-item">
                    <Link 
                      href="/dashboard" 
                      className={`nav-link ${router.pathname === '/dashboard' ? 'active' : ''}`}
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link 
                      href="/projects" 
                      className={`nav-link ${router.pathname.startsWith('/projects') ? 'active' : ''}`}
                    >
                      Projects
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link 
                      href="/tasks" 
                      className={`nav-link ${router.pathname.startsWith('/tasks') ? 'active' : ''}`}
                    >
                      Tasks
                    </Link>
                  </li>
                  {session.user.role === UserRole.ADMIN && (
                    <li className="nav-item dropdown">
                      <a 
                        className={`nav-link dropdown-toggle ${router.pathname.startsWith('/admin') ? 'active' : ''}`} 
                        href="#" 
                        id="adminDropdown" 
                        role="button" 
                        data-bs-toggle="dropdown" 
                        aria-expanded="false"
                      >
                        Admin
                      </a>
                      <ul className="dropdown-menu" aria-labelledby="adminDropdown">
                        <li>
                          <Link 
                            href="/admin/users" 
                            className="dropdown-item"
                          >
                            Manage Users
                          </Link>
                        </li>
                        <li>
                          <Link 
                            href="/admin/projects" 
                            className="dropdown-item"
                          >
                            All Projects
                          </Link>
                        </li>
                      </ul>
                    </li>
                  )}
                </>
              )}
            </ul>
            
            <ul className="navbar-nav ms-auto">
              {session ? (
                <li className="nav-item dropdown">
                  <a 
                    className="nav-link dropdown-toggle" 
                    href="#" 
                    id="userDropdown" 
                    role="button" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                  >
                    {session.user?.name || session.user?.email}
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                    <li>
                      <Link href="/profile" className="dropdown-item">
                        Profile
                      </Link>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button 
                        className="dropdown-item" 
                        onClick={() => signOut({ callbackUrl: '/' })}
                      >
                        Logout
                      </button>
                    </li>
                  </ul>
                </li>
              ) : (
                <>
                  <li className="nav-item">
                    <Link href="/login" className="nav-link">
                      Login
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link href="/signup" className="nav-link">
                      Sign Up
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}