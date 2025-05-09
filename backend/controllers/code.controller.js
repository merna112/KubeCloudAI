// backend/controllers/code.controller.js
const fetch = require('node-fetch');
const errorHandler = require('../utils/error');
require('dotenv').config();

const executeCode = async (req, res, next) => {
  const { language, code, stdin } = req.body; 


  if (!language || !code) {
    return next(errorHandler(400, 'Language and code are required.'));
  }


  if (!process.env.JDOODLE_CLIENT_ID || !process.env.JDOODLE_CLIENT_SECRET) {
      console.error("JDoodle API credentials missing in .env file.");
      return next(errorHandler(503, 'Code execution service is not configured.'));
  }

 
  let versionIndex = '0';
  let languageName = language.toLowerCase();

  if (languageName === 'javascript') { languageName = 'nodejs'; versionIndex = '4'; } // Node.js 18.15.0
  else if (languageName === 'python') { languageName = 'python3'; versionIndex = '4'; } // Python 3.10.0
  else if (languageName === 'java') { versionIndex = '4'; } // JDK 11.0.4
  else if (languageName === 'csharp') { languageName = 'csharp'; versionIndex = '4';} // Mono 6.12.0.122
  else if (languageName === 'cpp') { languageName = 'cpp17'; versionIndex = '1'; } // GCC 11.1.0


  const requestBody = {
    clientId: process.env.JDOODLE_CLIENT_ID,
    clientSecret: process.env.JDOODLE_CLIENT_SECRET,
    script: code,
    language: languageName,
    versionIndex: versionIndex,
    stdin: stdin || "", 
  };

  console.log("Sending code execution request to JDoodle:", { language: languageName, versionIndex }); 

  try {
    const jdoodleResponse = await fetch('https://api.jdoodle.com/v1/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

     if (!jdoodleResponse.ok) {
         const errorText = await jdoodleResponse.text(); 
         console.error("JDoodle API request error:", jdoodleResponse.status, errorText);
         let message = `JDoodle API error (${jdoodleResponse.status}). Check backend console.`;
         if(jdoodleResponse.status === 401) message = 'JDoodle API authentication failed (Invalid Credentials).';
         if(jdoodleResponse.status === 429) message = 'JDoodle API daily execution limit reached.';
         return next(errorHandler(jdoodleResponse.status > 499 ? 503 : jdoodleResponse.status, message));
     }


    const result = await jdoodleResponse.json();
    console.log("Received response from JDoodle:", result); 

    if (result.error) {
        console.error("JDoodle execution error:", result.error);
        return res.status(200).json({ output: result.error, error: true });
    }

    res.status(200).json({ output: result.output, error: false }); 

  } catch (error) {
    console.error("Error calling JDoodle API:", error);
    next(errorHandler(500, 'Failed to execute code due to a network or server error.'));
  }
};

module.exports = { executeCode };