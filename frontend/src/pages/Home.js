import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './Home.css';
import { FaSearch } from 'react-icons/fa'; // Import the search icon

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [artistDetails, setArtistDetails] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const suggestionListRef = useRef(null);

  // Fetch suggestions from the backend as the user types
  const handleInputChange = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim() === '') {
      setSuggestions([]);
      return;
    }

    try {
      const response = await axios.get(`https://artist-search-backend.vercel.app/api/suggest?q=${value}`);
      setSuggestions(response.data);
      setHighlightedIndex(-1);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  };

  // Handle search button click or "Enter" key press
  const handleSearch = async (query = null) => {
    const searchValue = query || searchQuery;
    if (searchValue.trim() === '') {
      setErrorMessage('Please enter an artist name.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setArtistDetails([]);
    setSuggestions([]);

    try {
      const response = await axios.get(`http://localhost:5000/api/search?q=${searchValue}`);
      setArtistDetails(response.data);
      setIsSearchActive(true);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setErrorMessage('No artist found.');
      } else {
        setErrorMessage('An error occurred while searching.');
      }
    } finally {
      setLoading(false);
      setHighlightedIndex(-1);
    }
  };

  // Handle keyboard navigation in suggestion list
  const handleKeyDown = (e) => {
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        setHighlightedIndex((prevIndex) =>
          prevIndex < suggestions.length - 1 ? prevIndex + 1 : prevIndex
        );
      } else if (e.key === 'ArrowUp') {
        setHighlightedIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : prevIndex));
      } else if (e.key === 'Enter') {
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSearch(suggestions[highlightedIndex]);
        } else {
          handleSearch();
        }
      }
    }
  };

  // Use effect to scroll highlighted suggestion into view
  useEffect(() => {
    if (suggestionListRef.current && highlightedIndex >= 0) {
      const activeItem = suggestionListRef.current.children[highlightedIndex];
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  // Extract genre names from the sub-collection
  const extractGenres = (genres) => {
    if (!genres || genres.length === 0) {
      return 'N/A';
    }
    return genres.map((genre) => genre.name).join(', ');
  };

  return (
    <div className="home">
      <div className={`search-container ${isSearchActive ? 'search-active' : ''}`}>
        <div className="search-bar-wrapper">
          <input
            type="text"
            placeholder="Search for artists..."
            className="search-bar"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
          <button className="search-button" onClick={() => handleSearch()}>
            <FaSearch />
          </button>
        </div>
        {suggestions.length > 0 && (
          <div className="suggestions-list" ref={suggestionListRef}>
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`suggestion-item ${index === highlightedIndex ? 'highlighted' : ''}`}
                onClick={() => handleSearch(suggestion)}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>

      {loading && <div className="loading">Loading...</div>}
      {errorMessage && <div className="error-message">{errorMessage}</div>}

      {artistDetails.length > 0 && (
        <div className="artist-details artist-details-scrollable">
          <h2>Artist Details</h2>
          {artistDetails.map((artist) => (
            <div key={artist.id} className="artist-info">
              <div className="artist-image">
                {artist.pp_url ? (
                  <img src={artist.pp_url} alt={`${artist.name} profile`} />
                ) : (
                  <div className="no-image">No Image</div>
                )}
              </div>
              <div className="artist-details-text">
                <p><strong>Name:</strong> {artist.name}</p>
                <p><strong>Location:</strong> {artist.location || 'N/A'}</p>
                <p><strong>Genres:</strong> {extractGenres(artist.genres)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
