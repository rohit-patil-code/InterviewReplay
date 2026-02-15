create table users (
  id uuid primary key default gen_random_uuid(),

  email varchar(255) unique not null,

  first_name varchar(100),
  last_name varchar(100),

  google_id varchar(255) unique,

  is_verified boolean default false,

  created_at timestamp default now(),
  updated_at timestamp default now()
);
