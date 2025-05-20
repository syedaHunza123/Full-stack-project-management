export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-light py-3 mt-auto">
      <div className="container">
        <div className="row">
          <div className="col-md-6">
            <p className="mb-0">© {currentYear} Project Management System. All rights reserved.</p>
          </div>
          <div className="col-md-6 text-md-end">
            <ul className="list-inline mb-0">
              <li className="list-inline-item">
                <a href="#" className="text-decoration-none">Privacy Policy</a>
              </li>
              <li className="list-inline-item">
                <a href="#" className="text-decoration-none">Terms of Service</a>
              </li>
              <li className="list-inline-item">
                <a href="#" className="text-decoration-none">Contact</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}