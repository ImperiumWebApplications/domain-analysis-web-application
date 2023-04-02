import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Paper,
  Box,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Typography,
} from "@mui/material";
import Alert from "@mui/lab/Alert";

import "./App.scss";

const App = () => {
  const [domain, setDomain] = useState("");
  const [data, setData] = useState(null);
  const [redirects, setRedirects] = useState([]);
  const [showAnimation, setShowAnimation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [disableSubmit, setDisableSubmit] = useState(false);

  const displayParameters = [
    "DA & PA",
    "TF & CF",
    "Referring Domains",
    "Total Backlinks",
    "Estimated Value",
    "Google Indexed",
    "Domain Drops",
    "Expiration Date",
    "Domain Age",
    "Redirected Domains",
  ];

  const [checkedParameters, setCheckedParameters] = useState(new Set<string>());

  const isValidDomain = (domain: string) => {
    const domainRegex = /^([a-zA-Z0-9-_]+\.){1}[a-zA-Z]{2,63}$/;
    return domainRegex.test(domain);
  };

  const formatCurrency = (amount: string) => {
    console.log("Method called and amount is: ", amount);
    const numericAmount = Number(amount);
    return numericAmount.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options = { year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString("en-US", options as any);
  };

  const formatDomainAge = (ageInDays: number) => {
    const years = Math.floor(ageInDays / 365);
    const months = Math.floor((ageInDays % 365) / 30);
    const days = ageInDays % 30;
    return `${years} Years ${months} Months ${days} Days`;
  };

  const handleCheckboxToggle = (parameter: string) => {
    const updatedCheckedParameters = new Set(checkedParameters);

    if (checkedParameters.has(parameter)) {
      updatedCheckedParameters.delete(parameter);
    } else {
      updatedCheckedParameters.add(parameter);
    }

    setCheckedParameters(updatedCheckedParameters);
  };

  const handleSubmit = async () => {
    if (!isValidDomain(domain)) {
      return;
    }

    setDisableSubmit(true);

    const lowerCaseDomain = domain.toLowerCase();

    const domDetailerApiKey = import.meta.env.VITE_DOM_DETAILER_API_KEY;
    const domDetailerApiUrl = `https://domdetailer.com/api/checkDomain.php?domain=${lowerCaseDomain}&app=DomDetailer&apikey=${domDetailerApiKey}&majesticChoice=root`;

    const corsProxyUrl = import.meta.env.VITE_CORS_PROXY_URL;
    const goDaddyApiUrl = `${corsProxyUrl}https://api.godaddy.com/v1/appraisal/${lowerCaseDomain}`;

    const isIndexedApiUrl = `https://trueimperium.com/is_domain_indexed/${lowerCaseDomain}`;

    const hostIoApiKey = import.meta.env.VITE_HOSTIO_API_KEY;
    const hostIoApiUrl = `https://host.io/api/domains/redirects/${lowerCaseDomain}?token=${hostIoApiKey}`;

    const completednsApiKey = import.meta.env.VITE_COMPLETE_DNS_API_KEY;
    const completednsApiUrl = `${corsProxyUrl}http://api.completedns.com/v2/dns-history/${lowerCaseDomain}?key=${completednsApiKey}`;

    const whoisApiKey = import.meta.env.VITE_WHOIS_API_KEY;
    const whoisApiUrl = `https://api.apilayer.com/whois/query?domain=${lowerCaseDomain}`;
    const whoisHeaders = new Headers();
    whoisHeaders.append("apikey", whoisApiKey);

    const requestOptions = {
      method: "GET",
      redirect: "follow",
      headers: whoisHeaders,
    };
    setIsLoading(true);
    setError("");
    setData(null);
    try {
      const responses = await Promise.all([
        fetch(domDetailerApiUrl),
        fetch(goDaddyApiUrl),
        fetch(isIndexedApiUrl),
        fetch(hostIoApiUrl),
        fetch(completednsApiUrl),
        fetch(whoisApiUrl, requestOptions as any),
      ]);

      const [
        domDetailerData,
        goDaddyData,
        isIndexedData,
        hostIoData,
        completednsData,
        whoisData,
      ] = await Promise.all(responses.map((response) => response.json()));

      const creationDate = new Date(whoisData.result.creation_date);
      const currentDate = new Date();
      const ageDifference = currentDate.getTime() - creationDate.getTime();
      const domainAgeInDays = Math.floor(ageDifference / (1000 * 3600 * 24));

      setData({
        ...domDetailerData,
        govalue: goDaddyData.govalue,
        isIndexed: isIndexedData.isIndexed,
        drops: completednsData.drops || 0,
        expiration_date: formatDate(whoisData.result.expiration_date),
        domain_age: formatDomainAge(domainAgeInDays),
      });

      setRedirects(hostIoData.domains || []);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setIsLoading(false);
      setError("An error occurred while fetching data. Please try again.");
    }
  };

  useEffect(() => {
    setDisableSubmit(false);
  }, [domain]);

  useEffect(() => {
    if (data) {
      setShowAnimation(false);
      setTimeout(() => {
        setShowAnimation(true);
      }, 50);
    }
  }, [data]);

  const parameterMapping = {
    "DA & PA": ["mozDA", "mozPA"],
    "TF & CF": ["majesticTF", "majesticCF"],
    "Referring Domains": ["majesticRefDomains"],
    "Total Backlinks": ["majesticLinks"],
    "Estimated Value": ["govalue"],
    "Google Indexed": ["isIndexed"],
    "Domain Drops": ["drops"],
    "Expiration Date": ["expiration_date"],
    "Domain Age": ["domain_age"],
    "Redirected Domains": ["Redirect Domain"],
  };

  return (
    <div className="App">
      <div className="container">
        <div className="content">
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            mt={3}
            mb={3}
            p={2}
            bgcolor="rgba(255, 255, 255, 0.3)"
            borderRadius="16px"
            maxWidth="800px"
            mx="auto"
          >
            <Typography variant="h4" component="h1" gutterBottom>
              Free Domain Metrics Checker - Built with{" "}
              <span role="img" aria-label="heart">
                ❤️
              </span>
            </Typography>
            <Typography variant="body1" component="p" gutterBottom>
              Hi, I'm Sumit, the founder of SerpNames.com.
            </Typography>
            <Typography variant="body1" component="p" gutterBottom>
              I built this domain metrics tool to help you get the latest SEO
              metrics (and other data) of your domain.
            </Typography>
            <Typography variant="body1" component="p" gutterBottom>
              It's completely free. Enjoy!{" "}
              <span role="img" aria-label="happy eyes">
                😊
              </span>
            </Typography>
          </Box>
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
              disabled={disableSubmit}
            >
              Submit
            </Button>
          </Box>
          <Box display="flex" justifyContent="center">
            <div className="checkbox-container">
              {displayParameters.map((parameter) => (
                <FormControlLabel
                  key={parameter}
                  control={
                    <Checkbox
                      checked={checkedParameters.has(parameter)}
                      onChange={() => handleCheckboxToggle(parameter)}
                      color="secondary"
                    />
                  }
                  label={parameter}
                />
              ))}
            </div>
          </Box>
        </div>
        {error && (
          <div className="error-container">
            <Alert
              severity="error"
              style={{ marginTop: "1rem", maxWidth: "500px" }}
            >
              {error}
            </Alert>
          </div>
        )}
        {isLoading ? (
          <div className="loader-container">
            <CircularProgress color="secondary" />
          </div>
        ) : data && showAnimation ? (
          <div className="result-container">
            {displayParameters
              .filter((parameter) => parameter !== "Redirected Domains")
              .map((parameter, index) =>
                checkedParameters.has(parameter) ? (
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
                      <span className="value">
                        :{" "}
                        {parameter === "Google Indexed"
                          ? data["isIndexed"] != null
                            ? data["isIndexed"]
                              ? "Yes"
                              : "No"
                            : "Not Available"
                          : parameter === "Estimated Value"
                          ? data["govalue"] != null
                            ? `$${formatCurrency(data["govalue"])}`
                            : "Not Available"
                          : (parameterMapping as any)[parameter]
                              .map((property: any) =>
                                data[property] != null
                                  ? data[property]
                                  : "Not Available"
                              )
                              .join(" & ")}
                      </span>
                    </div>
                  </Paper>
                ) : null
              )}

            {checkedParameters.has("Redirected Domains") &&
              redirects.map((redirectDomain, index) => (
                <Paper
                  key={redirectDomain}
                  className={`result-paper-${
                    displayParameters.length + index
                  } ${showAnimation ? "fadeInDown" : ""}`}
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

            {checkedParameters.has("Redirected Domains") && (
              <Paper
                className={`result-paper-${displayParameters.length + 10} ${
                  showAnimation ? "fadeInDown" : ""
                }`}
                elevation={3}
                style={{
                  animationDelay: `${(displayParameters.length + 10) * 100}ms`,
                }}
              >
                <div className="parameter-container">
                  <span className="parameter">Total Redirected Domains</span>
                  <span className="value">: {redirects.length}</span>
                </div>
              </Paper>
            )}
          </div>
        ) : null}

        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          mt={3}
          mb={3}
          p={2}
          bgcolor="rgba(255, 255, 255, 0.3)"
          borderRadius="16px"
          maxWidth="800px"
          mx="auto"
        >
          <Typography variant="h5" component="h2">
            How to Use Domain Metrics Checker?
          </Typography>
          <Typography variant="body1" component="p">
            Follow the 3 Simple Steps:
          </Typography>
          <Typography variant="body1" component="p">
            1. Enter your domain name (e.g., SerpNames.com) and press SUBMIT.
          </Typography>
          <Typography variant="body1" component="p">
            2. Wait for a few seconds.
          </Typography>
          <Typography variant="body1" component="p">
            3. Tick the metric checkboxes you're interested in to get the latest
            data.
          </Typography>
          <Typography variant="body1" component="p">
            Note: You can check up to 5 domains every 24 hours.
          </Typography>
          <Typography variant="body1" component="p">
            Need a new feature? Want to report a bug? Please send me an email at{" "}
            <a href="mailto:sumit@serpnames.com">sumit@serpnames.com</a> or say
            hi on{" "}
            <a
              href="https://www.facebook.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Facebook
            </a>
            ,{" "}
            <a
              href="https://www.linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Linkedin
            </a>{" "}
            or{" "}
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Twitter
            </a>
            .
          </Typography>
          <Typography variant="body1" component="p">
            I'd love to hear from you!
          </Typography>
        </Box>
      </div>
    </div>
  );
};

export default App;
