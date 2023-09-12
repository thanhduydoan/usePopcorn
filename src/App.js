import { useEffect, useRef, useState } from "react";
import StarRating from './StarRating'

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);
const KEY = "2bec7cd4"
// const QUERY = "interstellar"
export default function App() {
  const [movies, setMovies] = useState([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  // const [watched, setWatched] = useState([]);
  const [watched, setWatched] = useState(function() {
    const storedValue = localStorage.getItem('watched')
    return JSON.parse(storedValue)
  });

  function handleSelectMovie(id) {
    setSelectedId((selectedId) => selectedId === id ? null : id);
  }

  function handleCloseMovie() {
    setSelectedId(null)
  }

  function handleAddWatched(movie) {
    setWatched(watched => [...watched, movie])
    // localStorage.setItem('watched', JSON.stringify([...watched, movie]))
  }

  function handleDeleteWatched(id) {
    setWatched(watched.filter(movie => movie.imdbId !== id))
  }

  useEffect(function() {
    localStorage.setItem('watched', JSON.stringify(watched))
  },[watched])

  useEffect(() => {
    const controller = new AbortController()
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError('')
        const response = await fetch(
          `https://www.omdbapi.com/?apikey=${KEY}&s=${query}`, { signal: controller.signal }
        );
        if (!response.ok) throw new Error("Something went wrong with fetching movies")
        const data = await response.json();
        if (data.Response === "False") throw new Error('Movie not found')
        setMovies(data.Search)
        setError('')
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching data:", error.message);
        if (error.name !== "AbortError") {
          setError(error.message)
        }
      } finally {
        setIsLoading(false)
      }
    };
    if (query.length < 3) {
      setMovies([])
      setError('');
      return
    }
    handleCloseMovie();
    fetchData();
    return function () {
      controller.abort()
    }
  }, [query]);
  return (
    <>
      <Navbar>
        <Logo />
        <Search query={query} setQuery={setQuery} />
        <Numresult movies={movies} />
      </Navbar>
      <Main>
        {/* <Box element={<MovieList movies={movies} />} />
        <Box element={
          <>
            <WatchedSumary watched={watched} />
            <WatchMovieList watched={watched} />
          </>
        }
        /> */}
        <Box>
          {isLoading && <Loader />}
          {!isLoading && !error && <MovieList movies={movies} onSelectMovie={handleSelectMovie} />}
          {error && <ErrorMessage message={error} />}
        </Box>
        <Box>
          {selectedId ? <MovieDetails selectedId={selectedId} onCloseMovie={handleCloseMovie} onAddWatched={handleAddWatched} watched={watched} /> : <>
            <WatchedSumary watched={watched} />
            <WatchMovieList watched={watched} onDeleteWatched={handleDeleteWatched} />
          </>}
        </Box>
      </Main>
    </>
  );
}

function Loader() {
  return <p className="loader">Loading...</p>
}

function ErrorMessage({ message }) {
  return <p className="error">
    <span>🚫</span> {message}
  </p>
}

function Navbar({ children }) {
  return <nav className="nav-bar">
    {children}
  </nav >
}

function Search({ query, setQuery }) {
  const inputEl = useRef(null);

  useEffect(() => {
    function callback(e) {
      if(document.activeElement === inputEl.current) return
      if(e.code === "Enter") {
        inputEl.current.focus()
        setQuery('')
      }
    }

    document.addEventListener('keydown', callback)
    return () =>  document.addEventListener('keydown', callback)
  },[setQuery])

  return <input
    className="search"
    type="text"
    placeholder="Search movies..."
    value={query}
    onChange={(e) => setQuery(e.target.value)} 
    ref={inputEl}
  />
}

function Logo() {
  return <div className="logo">
    <span role="img">🍿</span>
    <h1>usePopcorn</h1>
  </div>
}

function Numresult({ movies }) {
  return (
    < p className="num-results" >
      Found <strong>{movies.length}</strong> results
    </p >
  )
}

function Main({ children }) {
  return <main className="main">
    {children}
  </main>
}

function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);
  return (<div className="box">
    <button
      className="btn-toggle"
      onClick={() => setIsOpen((open) => !open)}
    >
      {isOpen ? "–" : "+"}
    </button>
    {isOpen && children}
  </div>
  )
}

function MovieList({ movies, onSelectMovie }) {
  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <Movie movie={movie} key={movie.imdbID} onSelectMovie={onSelectMovie} />
      ))}
    </ul>
  )
}

function Movie({ movie, onSelectMovie }) {
  return <li onClick={() => onSelectMovie(movie.imdbID)}>
    <img src={movie.Poster} alt={`${movie.Title} poster`} />
    <h3>{movie.Title}</h3>
    <div>
      <p>
        <span>🗓</span>
        <span>{movie.Year}</span>
      </p>
    </div>
  </li>
}

function MovieDetails({ selectedId, onCloseMovie, onAddWatched, watched }) {
  const [isLoading, setIsLoading] = useState(false)
  const [movie, setMovie] = useState({})
  const [userRating, setUserRating] = useState("")
  const isWatched = watched.map(movie => movie.imdbId).includes(selectedId)
  const watchedUserRating = watched.find(movie => movie.imdbId === selectedId)?.userRating
  const { Title: title, Year: year, Poster: poster, Runtime: runtime, imdbRating, Plot: plot, Released: released, Actors: actors, Director: director, Genre: genre } = movie
  useEffect(() => {
    async function getMovieDetail() {
      setIsLoading(true)
      const response = await fetch(
        `https://www.omdbapi.com/?apikey=${KEY}&i=${selectedId}`
      );
      const data = await response.json();
      setMovie(data)
      setIsLoading(false)
    }
    getMovieDetail()
  }, [selectedId])

  useEffect(() => {
    if (!title) return
    document.title = `Movie | ${title}`
    return function () {
      document.title = "usePopcorn"
    }
  }, [title])

  function handleAdd() {
    const newWatchedMovie = {
      imdbId: selectedId,
      title, year, poster, imdbRating: Number(imdbRating), runtime: Number(runtime.split("").at(0)), userRating
    }
    onAddWatched(newWatchedMovie)
    onCloseMovie()
  }

  useEffect(() => {
    const callback = (e) => {
      if (e.code === 'Escape') {
        onCloseMovie()
      }
    }
    document.addEventListener('keydown', callback)
    return function () {
      document.removeEventListener('keydown', callback)
    }
  }, [onCloseMovie])
  return (
    <div className="details">
      {isLoading ? <Loader /> : <>
        <header>
          <button className="btn-back" onClick={onCloseMovie}>
            &larr;
          </button>
          <img src={poster} alt={`Poster of ${movie} movie`} />
          <div className="details-overview">
            <h2>{title}</h2>
            <p>{released} &bull; {runtime}</p>
            <p>{genre}</p>
            <p><span>⭐️</span>{imdbRating} Imdb Rating</p>
          </div>
        </header>
        <section>
          <div className='rating'>
            {!isWatched ?
              <>
                <StarRating maxRating={10} size={24} onSetRating={setUserRating} />
                {userRating > 0 && <button className="btn-add" onClick={handleAdd}>+ Add to list</button>}
              </> : <p>You rated with movie {watchedUserRating} <span>⭐️</span></p>
            }
          </div>
          <p><em>{plot}</em></p>
          <p>Starring {actors}</p>
          <p>Director by {director}</p>
        </section>
      </>}
    </div>
  );
}

function WatchedSumary({ watched }) {
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));
  return <div className="summary">
    <h2>Movies you watched</h2>
    <div>
      <p>
        <span>#️⃣</span>
        <span>{watched.length} movies</span>
      </p>
      <p>
        <span>⭐️</span>
        <span>{avgImdbRating.toFixed(2)}</span>
      </p>
      <p>
        <span>🌟</span>
        <span>{avgUserRating.toFixed(2)}</span>
      </p>
      <p>
        <span>⏳</span>
        <span>{avgRuntime} min</span>
      </p>
    </div>
  </div>
}

function WatchMovieList({ watched, onDeleteWatched }) {
  return <ul className="list">
    {watched.map((movie) => (
      <WatchedMovie key={movie.imdbID} movie={movie} onDeleteWatched={onDeleteWatched} />
    ))}
  </ul>
}

function WatchedMovie({ movie, onDeleteWatched }) {
  return <li >
    <img src={movie.poster} alt={`${movie.title} poster`} />
    <h3>{movie.title}</h3>
    <div>
      <p>
        <span>⭐️</span>
        <span>{movie.imdbRating}</span>
      </p>
      <p>
        <span>🌟</span>
        <span>{movie.userRating}</span>
      </p>
      <p>
        <span>⏳</span>
        <span>{movie.runtime} min</span>
      </p>
      <button className="btn-delete" onClick={() => onDeleteWatched(movie.imdbId)}>X</button>
    </div>
  </li>
}

