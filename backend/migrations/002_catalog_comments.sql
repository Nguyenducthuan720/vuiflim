CREATE TABLE catalog_comments (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(30) NOT NULL DEFAULT 'kkphim',
  movie_slug VARCHAR(200) NOT NULL,
  movie_title VARCHAR(250) NOT NULL,
  body VARCHAR(1000) NOT NULL,
  created BIGINT NOT NULL
);
CREATE INDEX catalog_comments_movie_idx ON catalog_comments(provider,movie_slug,created DESC,id);
