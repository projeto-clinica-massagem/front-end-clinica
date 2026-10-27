# Frontend Svelte

Nova versão do painel administrativo, preparada para deploy estático no GitHub Pages.

## Desenvolvimento

```bash
npm install
npm run dev
```

O proxy local encaminha `/api` para `http://127.0.0.1:8001`.

## API fake

Por padrão, o projeto usa uma API fake baseada em `src/lib/mock-data.json`. Ela funciona no navegador, não precisa de servidor e persiste alterações no `localStorage`.

Credenciais de teste:

```text
E-mail: admin@prover.com
Senha: 123456
```

Há dois clientes seedados: Mariana Costa e Rafael Lima. Para usar o backend real, configure `VITE_MOCK_API=false` e `VITE_API_URL`.

Para desenvolvimento local contra o Django via proxy Vite:

```bash
VITE_MOCK_API=false \
VITE_API_URL=/api \
VITE_DEV_API_TARGET=https://resident-ride-gender-portsmouth.trycloudflare.com \
npm run dev -- --port 5176
```

Para produção no GitHub Pages, o backend precisa liberar no CORS a origem `https://projeto-clinica-massagem.github.io` antes de usar `VITE_MOCK_API=false`.

## Build

```bash
BASE_PATH=/nome-do-repositorio npm run build
```

O resultado fica em `build/`. Em produção, configure a variável `VITE_API_URL` nas variables do repositório GitHub com a URL pública da API.

## Estado da migração

- Login com JWT: implementado.
- Layout responsivo: implementado.
- Dashboard inicial: implementado.
- Consulta de serviços: implementada.
- Agendamentos e vendas: páginas-base preparadas.
- Produtos, carrinhos, promoções e metas: próximos módulos.

## Testes Playwright

```bash
npm run test:e2e
```

Teste contra o Django real via proxy:

```bash
E2E_REAL=true \
E2E_EMAIL=tenant.admin@demo.example \
E2E_PASSWORD='use-a-demo-password-from-backend-docs' \
E2E_BASE_URL=http://127.0.0.1:5176 \
npm run test:e2e -- tests/e2e/real-api.spec.js
```
