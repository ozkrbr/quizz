
# Open source Kahoot alternative

This is an open source Kahoot alternative , a game-based learning platform that brings engagement and fun at school, work, and at home.
This project aims to provide similar functionality to Kahoot while being customizable and extensible for various educational and entertainment purposes.


1. The host starts the game
1. Players join the game
1. The host starts the questions
1. Players answer the questions
1. Results are shown


##  Built With
* [Nextjs](https://nextjs.org/)
* [PostgreSQL](https://www.postgresql.org/) (via [node-postgres](https://node-postgres.com/))
* [Tailwind CSS](https://tailwindcss.com/)

> This fork replaced Supabase with plain PostgreSQL. Database access goes through
> Next.js API routes (`src/app/api/**`) using `pg`, and the realtime game loop is
> served over Server-Sent Events (`/api/games/:id/events`) backed by an in-memory
> event bus (`src/lib/realtime.ts`) instead of Supabase Realtime. Player/host
> identity is a UUID kept in `localStorage` instead of Supabase anonymous auth.


## Run Locally
```sh
# 1. Install dependencies
npm install

# 2. Start PostgreSQL (Docker). The schema and seed in ./db run automatically
#    on first start.
docker compose up -d

# 3. Start Next.js locally
npm run dev

# Access the app at http://localhost:3000
```

The connection string lives in `.env.local` (`DATABASE_URL`). The schema is in
`db/schema.sql` and the seed quizzes in `db/seed.sql`.

Access the project root at / to join as a player.

Access /host to join as a host.


## Contributing

We welcome contributions from the community! If you'd like to contribute, please follow these guidelines:

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/YourFeature`).
3. Commit your changes (`git commit -am 'Add some feature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Create a new Pull Request.

## License
This project is licensed under the [MIT License](https://choosealicense.com/licenses/mit/)

