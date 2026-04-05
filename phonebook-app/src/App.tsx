import { useState } from "react";
import ContactList from "./pages/Contact List/ContactList";
import LoginRegister from "./pages/LoginRegister/LoginRegister";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return isLoggedIn ? (
    <ContactList />
  ) : (
    <LoginRegister onLogin={() => setIsLoggedIn(true)} />
  );
}

export default App;
