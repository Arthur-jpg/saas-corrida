import React, { useEffect } from 'react';
import '../styles/LandingPage.css';
import { SignInButton, UserButton, useUser, useSignIn } from '@clerk/clerk-react';

export default function LandingPage({ onStartFree, onStartPremium }) {
  // Força scroll para o topo ao carregar
  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.style.overflow = 'visible';
    document.documentElement.style.overflow = 'visible';
  }, []);

  const { isSignedIn, user } = useUser();
  const { openSignIn } = useSignIn();

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <nav className="landing-nav">
        <div className="nav-brand">
          <span className="nav-icon">🏃</span>
          RunSheet
        </div>
        <div className="nav-links">          <a href="#features">Recursos</a>
          <a href="#pricing">Planos</a>
          {isSignedIn ? <UserButton /> : <SignInButton />}
          <button className="nav-btn signup" onClick={onStartFree}>Começar Grátis</button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">          <h1>Planilhas de Treino<br />com IA Esportiva</h1>
          <p>Crie planilhas personalizadas para corrida, caminhada, triathlon e trail running em segundos usando inteligência artificial.</p>
          <button className="cta-button" onClick={onStartFree}>Experimente Grátis</button>
          <div className="hero-stats">
            <div className="stat">
              <h3>2000+</h3>
              <p>Atletas</p>
            </div>
            <div className="stat">
              <h3>50.000+</h3>
              <p>Planilhas</p>
            </div>
            <div className="stat">
              <h3>4.9/5</h3>
              <p>Avaliação</p>
            </div>
          </div>
        </div>
        <div className="hero-image">
          <img src="/hero-preview.png" alt="RunSheet Preview" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <h2>Recursos Poderosos</h2>
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">🤖</span>
            <h3>IA Esportiva</h3>
            <p>Algoritmo treinado com milhares de planilhas profissionais de treino.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">📊</span>
            <h3>Planilhas Personalizadas</h3>
            <p>Adaptadas ao seu nível, objetivos e disponibilidade de tempo.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🔄</span>
            <h3>Multi-esportes</h3>
            <p>Suporte para corrida, caminhada, triathlon e trail running.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">💬</span>
            <h3>Chat Inteligente</h3>
            <p>Tire dúvidas e ajuste sua planilha em tempo real.</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing">
        <h2>Planos e Preços</h2>
        <div className="pricing-grid">
          <div className="pricing-card">
            <div className="pricing-header">
              <h3>Gratuito</h3>
              <p className="price">R$ 0</p>
            </div>
            <ul className="pricing-features">
              <li>✓ Chat ilimitado</li>
              <li>✓ Planilhas básicas</li>              <li>✓ Múltiplos esportes</li>
              <li className="disabled">✗ Planilhas avançadas</li>
              <li className="disabled">✗ Exportação PDF/Excel</li>
            </ul>
            <button className="pricing-btn" onClick={onStartFree}>Começar Grátis</button>
          </div>
          <div className="pricing-card premium">
            <div className="pricing-header">
              <h3>Premium</h3>
              <p className="price">R$ 29,90<span>/mês</span></p>
            </div>
            <ul className="pricing-features">
              <li>✓ Chat ilimitado</li>
              <li>✓ Planilhas avançadas</li>
              <li>✓ Múltiplos esportes</li>              <li>✓ Exportação PDF/Excel</li>
              <li>✓ Suporte prioritário</li>
            </ul>
            <button className="pricing-btn" onClick={async () => {
    if (!isSignedIn) {
      if (openSignIn) openSignIn();
      return;
    }
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'premium', clerkUserId: user.id })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Erro ao redirecionar para o pagamento.');
      }
    } catch (e) {
      alert('Erro ao conectar ao servidor de pagamentos.');
    }
}}>Assinar Premium</button>
          </div>
        </div>
      </section>

      {/* CTA Section */}      <section className="cta">
        <h2>Comece a Treinar Melhor Hoje</h2>
        <p>Junte-se a milhares de atletas que já estão usando RunSheet</p>
        <button className="cta-button" onClick={onStartFree}>Criar Conta Grátis</button>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-brand">
          <span className="nav-icon">🏃</span>
          RunSheet
        </div>
        <div className="footer-links">
          <div className="footer-col">
            <h4>Produto</h4>
            <a href="#features">Recursos</a>
            <a href="#pricing">Preços</a>
          </div>
          <div className="footer-col">
            <h4>Empresa</h4>
            <a href="#">Sobre</a>
            <a href="#">Blog</a>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <a href="#">Privacidade</a>
            <a href="#">Termos</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 RunSheet. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
