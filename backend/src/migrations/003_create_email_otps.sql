create table email_otps (
  id uuid primary key default gen_random_uuid(),

  email varchar(255) not null,

  otp_hash text not null,
  expires_at timestamp not null,
  attempts int default 0,

  created_at timestamp default now()
);

create index idx_email_otps_email on email_otps(email);
