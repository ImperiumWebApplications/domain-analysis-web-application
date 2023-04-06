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
import useRateLimiter from "./hooks/useRateLimiter";

import "./App.scss";

const App = () => {
  const [domain, setDomain] = useState("");
  const [data, setData] = useState(null);
  const [redirects, setRedirects] = useState({});
  const [showAnimation, setShowAnimation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [disableSubmit, setDisableSubmit] = useState(true);
  const [submitClicked, setSubmitClicked] = useState(false);
  const [fetchedData, setFetchedData] = useState<Record<string, any>>({});

  const maxRequests = 10;
  const duration = 24 * 60 * 60 * 1000; // 24 hours
  const { remainingRequests, decrementRemainingRequests } = useRateLimiter(
    maxRequests,
    duration
  );

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

  const [checkBoxStates, setCheckBoxStates] = useState<Record<string, boolean>>(
    displayParameters.reduce(
      (acc, parameter) => ({ ...acc, [parameter]: false }),
      {}
    )
  );

  // const [checkBoxStates, setCheckedParameters] = useState(new Set<string>());

  const isValidDomain = (domain: string) => {
    const domainRegex = /^([a-zA-Z0-9-_]+\.){1}[a-zA-Z]{2,63}$/;
    return domainRegex.test(domain);
  };

  const formatCurrency = (amount: string) => {
    const numericAmount = Number(amount);
    return numericAmount.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const formatNumberWithCommas = (number: number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const fetchDataForParameter = async (parameter: string) => {
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

    // Define the API URL and headers for each parameter here
    const apiInfo: Record<string, any> = {
      "DA & PA": {
        apiUrl: domDetailerApiUrl,
        headers: {
          /* headers for the DA & PA API */
        },
      },
      "TF & CF": {
        apiUrl: domDetailerApiUrl,
        headers: {
          /* headers for the TF & CF API */
        },
      },
      "Referring Domains": {
        apiUrl: domDetailerApiUrl,
        headers: {
          /* headers for the TF & CF API */
        },
      },
      "Total Backlinks": {
        apiUrl: domDetailerApiUrl,
        headers: {
          /* headers for the TF & CF API */
        },
      },
      "Estimated Value": {
        apiUrl: goDaddyApiUrl,
        headers: {
          /* headers for the TF & CF API */
        },
      },
      "Google Indexed": {
        apiUrl: isIndexedApiUrl,
        headers: {
          /* headers for the TF & CF API */
        },
      },
      "Domain Drops": {
        apiUrl: completednsApiUrl,
        headers: {
          /* headers for the TF & CF API */
        },
      },
      "Expiration Date": {
        apiUrl: whoisApiUrl,
        headers: whoisHeaders,
      },
      "Domain Age": {
        apiUrl: whoisApiUrl,
        headers: whoisHeaders,
      },
      "Redirected Domains": {
        apiUrl: hostIoApiUrl,
        headers: {
          /* headers for the TF & CF API */
        },
      },
    };

    const { apiUrl, headers } = apiInfo[parameter];
    const response = await fetch(apiUrl, headers);
    const data = await response.json();

    if (parameter === "Redirected Domains") {
      setRedirects({
        total: data.total,
        domains: data.domains,
      });
    }

    // Save the data in the fetchedData state variable
    const updatedFetchedData = { ...fetchedData, [parameter]: data };
    setFetchedData(updatedFetchedData);
    setData((prevData) => ({ ...(prevData as any), ...updatedFetchedData }));
    return data;
  };

  const getDataForParameter = async (parameter: string) => {
    // If the data has already been fetched, return it
    if (fetchedData[parameter]) {
      return fetchedData[parameter];
    }

    // Otherwise, fetch the data and save it in the fetchedData state variable
    return await fetchDataForParameter(parameter);
  };
  const handleCheckboxToggle = async (parameter: string) => {
    const updatedCheckedParameters = { ...checkBoxStates };

    if (checkBoxStates[parameter]) {
      updatedCheckedParameters[parameter] = false;
    } else {
      updatedCheckedParameters[parameter] = true;
      // If the submit button has been clicked at least once and the data for the parameter hasn't been fetched yet
      if (submitClicked && !data![(parameterMapping as any)[parameter][0]]) {
        setIsLoading(true);
        const newData = await fetchDataForParameter(parameter);
        setData((prevData) => {
          setIsLoading(false);
          return { ...(prevData as any), ...newData };
        });
      }
    }

    setCheckBoxStates(updatedCheckedParameters);
  };

  const handleSubmit = async () => {
    if (!isValidDomain(domain)) {
      return;
    }

    if (remainingRequests <= 0) {
      setError(
        "You have reached your daily limit of 10 searches. Please try again tomorrow."
      );
      return;
    }

    if (checkBoxStates) decrementRemainingRequests();

    setDisableSubmit(true);
    setIsLoading(true);
    setError("");
    setData(null);
    try {
      setSubmitClicked(true);

      // Fetch data only for the selected checkboxes
      const fetchedData = await Promise.all(
        Object.keys(checkBoxStates)
          .filter((parameter) => checkBoxStates[parameter])
          .map((parameter) => {
            return getDataForParameter(parameter);
          })
      );

      // Combine the fetched data into a single object
      const combinedData = fetchedData.reduce((accumulator, data) => {
        return { ...accumulator, ...data };
      }, {});

      setData(combinedData);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setIsLoading(false);
      setError("An error occurred while fetching data. Please try again.");
    }
  };

  useEffect(() => {
    if (!domain) return;
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
    "Total Backlinks": ["majesticLinks", formatNumberWithCommas],
    "Referring Domains": ["majesticRefDomains", formatNumberWithCommas],
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
                      checked={checkBoxStates[parameter]}
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
                checkBoxStates[parameter] ? (
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
                          : parameter === "Referring Domains" ||
                            parameter === "Total Backlinks"
                          ? data[(parameterMapping as any)[parameter][0]] !=
                            null
                            ? (parameterMapping as any)[parameter][1](
                                data[(parameterMapping as any)[parameter][0]]
                              )
                            : "Not Available"
                          : data[(parameterMapping as any)[parameter][0]] !=
                            null
                          ? data[(parameterMapping as any)[parameter][0]]
                          : "Not Available"}
                      </span>
                    </div>
                  </Paper>
                ) : null
              )}

            {checkBoxStates["Redirected Domains"] && redirects && (
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
                  <span className="value">: {(redirects as any).total}</span>
                </div>
              </Paper>
            )}

            {checkBoxStates["Redirected Domains"] &&
              redirects &&
              (redirects as any).domains.map(
                (redirectDomain: any, index: any) => (
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
                      <span className="parameter">Redirected Domain</span>
                      <span className="value">: {redirectDomain}</span>
                    </div>
                  </Paper>
                )
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
            How to Use SerpNames Checker?
          </Typography>
          <Typography variant="body1" component="p">
            1. Enter your domain name (e.g., SerpNames.com) and press SUBMIT.
          </Typography>
          <Typography variant="body1" component="p">
            2. Tick the metric checkboxes you're interested in to get the latest
            data.
          </Typography>
        </Box>
      </div>
    </div>
  );
};
export default App;
