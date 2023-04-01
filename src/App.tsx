import React, { useState, useEffect } from "react";
import { TextField, Button, Paper, Box } from "@mui/material";
import "./App.css";

const App = () => {
  const [domain, setDomain] = useState("");
  const [data, setData] = useState(null);
  const [redirects, setRedirects] = useState([]);
  const [showAnimation, setShowAnimation] = useState(false);

  const isValidDomain = (domain: string) => {
    const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-_]+\.){1,}[a-zA-Z]{2,63}$/;
    return domainRegex.test(domain);
  };

  const handleSubmit = async () => {
    if (!isValidDomain(domain)) {
      return;
    }

    const domDetailerApiKey = import.meta.env.VITE_DOM_DETAILER_API_KEY;
    const domDetailerApiUrl = `https://domdetailer.com/api/checkDomain.php?domain=${domain}&app=DomDetailer&apikey=${domDetailerApiKey}&majesticChoice=root`;

    const corsProxyUrl = import.meta.env.VITE_CORS_PROXY_URL;
    const goDaddyApiUrl = `${corsProxyUrl}https://api.godaddy.com/v1/appraisal/${domain}`;

    try { 
      const responses = await Promise.all([
        fetch(domDetailerApiUrl),
        fetch(goDaddyApiUrl),
      ]);

      const [domDetailerData, goDaddyData] = await Promise.all(
        responses.map((response) => response.json())
      );

      setData({ ...domDetailerData, govalue: goDaddyData.govalue });

      // New code added here:
      const hostIoApiKey = import.meta.env.VITE_HOSTIO_API_KEY;
      const hostIoApiUrl = `https://host.io/api/domains/redirects/${domain}?token=${hostIoApiKey}`;

      const hostIoResponse = await fetch(hostIoApiUrl);
      const hostIoData = await hostIoResponse.json();

      setRedirects(hostIoData.domains || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const displayParameters = [
    "mozDA",
    "mozPA",
    "majesticTF",
    "majesticCF",
    "majesticLinks",
    "majesticRefDomains",
    "govalue",
  ];

  useEffect(() => {
    if (data) {
      setShowAnimation(false);
      setTimeout(() => {
        setShowAnimation(true);
      }, 50);
    }
  }, [data]);

  return (
    <div className="App">
      <div className="container">
        <div className="content">
          <h1 className="title">DOMAIN ANALYSIS</h1>
          <Box display="flex" alignItems="center">
            <TextField
              variant="outlined"
              color="secondary"
              placeholder="Enter domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              style={{ marginRight: "1rem", color: "white" }}
              InputProps={{ style: { color: "white" } }}
            />
            <Button
              variant="contained"
              color="secondary"
              onClick={handleSubmit}
            >
              Submit
            </Button>
          </Box>
        </div>
        {data && (
          <div className="result-container">
            {displayParameters.map((parameter, index) => (
              <Paper
                key={parameter}
                className={`result-paper-${index} ${
                  showAnimation ? "fadeInDown" : ""
                }`}
                elevation={3}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="parameter-container">
                  <span className="parameter">{parameter}</span>
                  <span className="value">: {data[parameter]}</span>
                </div>
              </Paper>
            ))}
            {redirects.slice(0, 10).map((redirectDomain, index) => (
              <Paper
                key={redirectDomain}
                className={`result-paper-${displayParameters.length + index} ${
                  showAnimation ? "fadeInDown" : ""
                }`}
                elevation={3}
                style={{
                  animationDelay: `${
                    (displayParameters.length + index) * 100
                  }ms`,
                }}
              >
                <div className="parameter-container">
                  <span className="parameter">Redirect Domain</span>
                  <span className="value">: {redirectDomain}</span>
                </div>
              </Paper>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
