# Deploy do Quizz na AWS EC2

A aplicação é distribuída como a imagem Docker pública
[`ozkr/quizz`](https://hub.docker.com/r/ozkr/quizz) e roda em conjunto com um
PostgreSQL via `docker-compose.prod.yml`.

## Imagem Docker

Build e push (feitos a partir deste repositório):

```sh
docker build -t ozkr/quizz:latest .
docker push ozkr/quizz:latest
```

A imagem usa o output **standalone** do Next.js e expõe a porta `3000`.
Variável de ambiente obrigatória em runtime:

- `DATABASE_URL` — string de conexão do Postgres (ex.: `postgres://kahoot:senha@db:5432/kahoot`)

## Provisionar a instância EC2

1. Suba uma instância (ex.: Amazon Linux 2023 ou Ubuntu 22.04, `t3.small`+).
2. No **Security Group**, libere:
   - `22` (SSH) para o seu IP
   - `80` (HTTP) para `0.0.0.0/0`
3. Instale Docker e o plugin Compose:

   ```sh
   # Amazon Linux 2023
   sudo dnf install -y docker
   sudo systemctl enable --now docker
   sudo usermod -aG docker ec2-user
   DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
   mkdir -p $DOCKER_CONFIG/cli-plugins
   curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
     -o $DOCKER_CONFIG/cli-plugins/docker-compose
   chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose
   ```

   (Reconecte o SSH para o grupo `docker` valer.)

## Subir a aplicação

```sh
git clone https://github.com/ozkrbr/quizz.git
cd quizz
export POSTGRES_PASSWORD='troque-esta-senha'
# QUIZZ_IMAGE já tem default ozkr/quizz:latest; defina só para usar outra imagem.
docker compose -f docker-compose.prod.yml up -d
```

O `schema.sql` e o `seed.sql` (em `./db`) são aplicados automaticamente na
primeira subida do Postgres. Acesse `http://<IP-público-da-EC2>/host` para o
painel do apresentador.

### Atualizar para uma nova versão

```sh
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

## Notas

- O realtime do jogo usa SSE com um event bus em memória, então rode **uma única
  instância** do container `app` (sem múltiplas réplicas atrás de load balancer).
- Para HTTPS, coloque um proxy (Caddy/Nginx) ou um ALB com certificado ACM na
  frente da porta 80.
- Para um banco gerenciado (RDS), basta apontar `DATABASE_URL` para o RDS e
  remover o serviço `db` do compose (aplicando `schema.sql`/`seed.sql` manualmente).
