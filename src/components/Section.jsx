import React, { useState } from "react";
import "./Section.css";

function displayJSON(data) {
  return JSON.stringify(data, null, 4);
}

function Section() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = () => {
    fetch("http://localhost:3000/scraped-data")
      .then((response) => response.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  };

  const handleInput = () => {
    setLoading(true);
    fetchData();
  };

  return (
    <div className="flex flex-col items-center">
      <input
        className={`bg-black w-80 h-10 border-0 rounded-lg p-2 px-6 text-base text-white }`}
        type="text"
        defaultValue="https://wsa-test.vercel.app"
        disabled
      />
      <button
        className={`my-4 text-2xl btn btn-neutral  ${
          loading ? "disabled" : "enabled"
        }`}
        onClick={() => handleInput()}
      >
        Fetch
      </button>

      {(data || loading) && (
        <div className="flex justify-center">
          {!loading ? (
            <pre className="my-5 w-1/2 whitespace-pre-wrap  p-6 min-w-auto">
              {displayJSON(data)}
            </pre>
          ) : (
            <span className="loading loading-dots loading-lg"></span>
          )}
        </div>
      )}
    </div>
  );
}

export default Section;
