import { useEffect, useState } from 'react'
import './App.css'

const USERS_PER_PAGE = 30

function formatFieldName(name) {
  return name
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function UserField({ name, value }) {
  const formattedValue = value == null ? '—' : String(value)

  return (
    <div className="user-field">
      <dt>{formatFieldName(name)}</dt>
      <dd>
        {typeof value === 'string' && value.startsWith('https://') ? (
          <a href={value} target="_blank" rel="noreferrer">
            {value}
          </a>
        ) : (
          formattedValue
        )}
      </dd>
    </div>
  )
}

function UserCard({ user }) {
  return (
    <article className="user-card">
      <div className="card-topline">
        <span className="user-type">{user.type}</span>
        {user.site_admin && <span className="admin-badge">GitHub admin</span>}
      </div>

      <img className="avatar" src={user.avatar_url} alt={`${user.login}'s avatar`} />

      <h2>{user.login}</h2>
      <p className="user-id">User ID {user.id}</p>

      <a
        className="profile-link"
        href={user.html_url}
        target="_blank"
        rel="noreferrer"
      >
        View GitHub profile <span aria-hidden="true">↗</span>
      </a>

      <details className="api-details">
        <summary>All API data</summary>
        <dl>
          {Object.entries(user).map(([name, value]) => (
            <UserField key={name} name={name} value={value} />
          ))}
        </dl>
      </details>
    </article>
  )
}

function App() {
  const [users, setUsers] = useState([])
  const [page, setPage] = useState(1)
  const [retry, setRetry] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchUsers() {
      try {
        const response = await fetch(
          `https://api.github.com/users?per_page=${USERS_PER_PAGE}&page=${page}`,
          { signal: controller.signal },
        )

        if (!response.ok) {
          throw new Error(
            response.status === 403
              ? 'GitHub has temporarily limited API requests. Please try again shortly.'
              : `GitHub API request failed (${response.status}). Please try again.`,
          )
        }

        const data = await response.json()
        if (!Array.isArray(data)) {
          throw new Error('GitHub returned an unexpected response. Please try again.')
        }

        setUsers((currentUsers) =>
          page === 1 ? data : [...currentUsers, ...data],
        )
        setHasMore(data.length === USERS_PER_PAGE)
      } catch (fetchError) {
        if (!controller.signal.aborted) {
          setError(fetchError.message || 'Unable to load GitHub users.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchUsers()
    return () => controller.abort()
  }, [page, retry])

  const filteredUsers = users.filter((user) =>
    user.login.toLowerCase().includes(search.trim().toLowerCase()),
  )

  function loadMore() {
    setError('')
    setLoading(true)
    setPage((currentPage) => currentPage + 1)
  }

  function retryRequest() {
    setError('')
    setLoading(true)
    setRetry((currentRetry) => currentRetry + 1)
  }

  return (
    <main className="page-shell">
      <header className="site-header">
        <a className="brand" href="https://github.com" aria-label="GitHub">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.55.1.76-.24.76-.54v-2.1c-3.1.67-3.75-1.31-3.75-1.31-.5-1.28-1.24-1.62-1.24-1.62-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15 1 .1.65 1.97 3.48 1.5.1-.74.39-1.24.7-1.53-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.11-2.96 0 0 .94-.3 3.05 1.15a10.6 10.6 0 0 1 5.55 0c2.12-1.44 3.05-1.15 3.05-1.15.61 1.54.23 2.68.11 2.96.72.78 1.15 1.78 1.15 3 0 4.3-2.62 5.23-5.11 5.5.4.35.75 1.03.75 2.08v3.08c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z" />
          </svg>
          <span>GitHub users</span>
        </a>
        <a
          className="header-link"
          href="https://docs.github.com/en/rest"
          target="_blank"
          rel="noreferrer"
        >
          API documentation <span aria-hidden="true">↗</span>
        </a>
      </header>

      <section className="intro">
        <p className="eyebrow"><span className="live-dot" /> The open-source community</p>
        <h1>Meet the people<br />building on GitHub.</h1>
        <p className="intro-copy">
          Discover GitHub users from around the world. Browse their profiles
          and explore the data shared by the GitHub API.
        </p>
        <div className="intro-meta">
          <span><strong>{users.length}</strong> users loaded</span>
          <span className="meta-divider" />
          <span>Live from the GitHub API</span>
        </div>
      </section>

      <section className="directory" aria-labelledby="directory-title">
        <div className="directory-heading">
          <div>
            <p className="section-label">Community directory</p>
            <h2 id="directory-title">GitHub users</h2>
          </div>
          <label className="search-box">
            <span className="search-icon" aria-hidden="true">⌕</span>
            <span className="visually-hidden">Search usernames</span>
            <input
              type="search"
              placeholder="Search usernames..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <button
                type="button"
                className="clear-search"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </label>
        </div>

        {error && (
          <div className="feedback error-message" role="alert">
            <p>{error}</p>
            <button type="button" onClick={retryRequest}>Try again</button>
          </div>
        )}

        {loading && users.length === 0 && (
          <div className="feedback loading-message" role="status">
            <span className="spinner" />
            <span>Finding GitHub users...</span>
          </div>
        )}

        {!loading && users.length === 0 && !error && (
          <p className="feedback empty-message">No GitHub users were returned.</p>
        )}

        {users.length > 0 && filteredUsers.length === 0 && (
          <p className="feedback empty-message">
            No usernames match “{search}”. Try a different search.
          </p>
        )}

        {filteredUsers.length > 0 && (
          <div className="user-grid">
            {filteredUsers.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        )}

        {hasMore && users.length > 0 && !error && (
          <div className="load-more-wrap">
            <button
              className="load-more"
              type="button"
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? <><span className="button-spinner" /> Loading users...</> : 'Load more users'}
            </button>
          </div>
        )}

        {!hasMore && users.length > 0 && (
          <p className="end-message">You’re all caught up.</p>
        )}
      </section>

      <footer className="site-footer">
        <span>Built with the GitHub REST API</span>
        <a href="https://github.com" target="_blank" rel="noreferrer">Explore GitHub ↗</a>
      </footer>
    </main>
  )
}

export default App
