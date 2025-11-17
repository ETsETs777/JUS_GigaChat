"use client";
import Cookies from "js-cookie";
import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "../../components/Logo/Logo";
import { validateToken } from "../../utils/validateToken";
import styles from "./Header.module.css";

const Header = () => {
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      const token = Cookies.get("token");
      if (token) {
        const valid = await validateToken(token);
        setIsTokenValid(valid);
        if (!valid) {
          Cookies.remove("token");
        }
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    };
    
    checkToken();
    
    const interval = setInterval(() => {
      const token = Cookies.get("token");
      if (token) {
        validateToken(token).then((valid) => {
          if (!valid) {
            setIsTokenValid(false);
            Cookies.remove("token");
          }
        });
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div>
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <Logo />
        </div>
        <button
          className={styles.burgerButton}
          onClick={toggleMobileMenu}
          aria-label="Открыть меню"
          aria-expanded={isMobileMenuOpen}
        >
          <span className={styles.burgerLine}></span>
          <span className={styles.burgerLine}></span>
          <span className={styles.burgerLine}></span>
        </button>
        <div
          className={`${styles.navContainer} ${
            isLoading ? styles.fadeOut : styles.fadeIn
          } ${isMobileMenuOpen ? styles.mobileMenuOpen : ""}`}
        >
          <nav className={styles.nav}>
            <ul className={styles.navList}>
              {isTokenValid ? (
                <>
                  <li>
                    <Link href="/home" className={styles.navItem} onClick={closeMobileMenu}>
                      Главная
                    </Link>
                  </li>
                  <li>
                    <Link href="/profile" className={styles.navItem} onClick={closeMobileMenu}>
                      Профиль
                    </Link>
                  </li>
                  <li>
                    <Link href="/buySub" className={styles.navItem} onClick={closeMobileMenu}>
                      Тарифы
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link href="/login" className={styles.navItem} onClick={closeMobileMenu}>
                      Войти
                    </Link>
                  </li>
                  <li>
                    <Link href="/register" className={styles.navItem} onClick={closeMobileMenu}>
                      Зарегистрироваться
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </header>
      {isMobileMenuOpen && (
        <div className={styles.mobileMenuOverlay} onClick={closeMobileMenu}></div>
      )}
      <div className={styles.separator} />
    </div>
  );
};

export default Header;
