import {useState, useEffect} from 'react'
const KEY = "2bec7cd4"

export function useMovies(query ) {
    const [movies, setMovies] = useState([]);
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
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
        // handleCloseMovie();
        fetchData();
        return function () {
            controller.abort()
        }
    }, [query]);
    return {movies, isLoading, error}
}