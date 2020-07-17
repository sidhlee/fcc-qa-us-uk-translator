import { americanOnly } from './american-only.js';
import { britishOnly } from './british-only.js';
import { americanToBritishSpelling } from './american-to-british-spelling.js';
import { americanToBritishTitles } from './american-to-british-titles.js';

const textArea = document.getElementById('text-input');
const localeSelect = document.getElementById('locale-select');
const translateButton = document.getElementById('translate-btn');
const clearButton = document.getElementById('clear-btn');
const outputDiv = document.getElementById('translated-sentence');
const errorDiv = document.getElementById('error-msg');

/**
 * Create a new dictionary where key-value pairs are reversed.
 * @param {{[string]: string}} dict
 */
const reverseDict = (dict) => {
  return Object.keys(dict).reduce((newDict, key) => {
    newDict[dict[key]] = key;
    return newDict;
  }, {});
};

const capitalize = (str) => {
  return str[0].toUpperCase() + str.slice(1);
};

const isCapitalized = (word) => {
  return word[0] === word[0].toUpperCase();
};

/**
 * Create a new dictionary with all the properties from input dictionary and add capitalized versions of them.
 * @param {{[string]: sting}} titleDict
 */
const capitalizeDict = (titleDict) => {
  return Object.entries(titleDict).reduce((obj, [inputTitle, outputTitle]) => {
    obj[inputTitle] = outputTitle;
    obj[capitalize(inputTitle)] = capitalize(outputTitle);
    return obj;
  }, {});
};

const aToBTitles = capitalizeDict(americanToBritishTitles);
const britishToAmericanTitles = reverseDict(americanToBritishTitles);
const bToATitles = capitalizeDict(britishToAmericanTitles);

const aToBSpellings = americanToBritishSpelling;
const bToASpellings = reverseDict(americanToBritishSpelling);

const aToBDict = {
  ...aToBSpellings,
  ...americanOnly,
};
const bToADict = {
  ...bToASpellings,
  ...britishOnly,
};

/**
 *
 * @param {string} string input string
 * @param {string} targetLocale 'british' | 'american'
 * @param {string[]} translatedWords array that keeps all the translated words
 */
const translateTime = (string, targetLocale = 'british', translatedWords) => {
  if (!['american', 'british'].includes(targetLocale)) {
    throw new Error('invalid target locale');
  }
  const pattern =
    targetLocale === 'british'
      ? /([\d]{1,2}):([\d]{1,2})/
      : /([\d]{1,2})\.([\d]{1,2})/;

  let output = string.replace(pattern, (match, p1, p2) => {
    const delimiter = targetLocale === 'british' ? '.' : ':';
    const convertedTime = p1 + delimiter + p2;
    translatedWords.push(convertedTime);
    return convertedTime;
  });

  return output;
};

const createRegex = (str, flag) => {
  const escaped = str.replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
  // 1. positive look behind for preventing 'chippy' from being translated to 'fish-and-fish-and-chip shop'
  // 2. ending negative lookahead to prevent matching 'chip' in 'chippy'
  return new RegExp(`(?<!-)${escaped}(?=\\W)`, flag);
};

/**
 *
 * @param {string} sentence input string to translate
 * @param {string} targetLocale 'british' | 'american'
 * @returns
 */
const translate = (sentence, targetLocale = 'british') => {
  const locales = ['british', 'american'];
  if (!locales.includes(targetLocale)) {
    throw new Error('invalid target locale');
  }

  const translatedWords = [];
  const dict = targetLocale === 'british' ? aToBDict : bToADict;

  let processedSentence;

  /* 
    Preprocess title and time because 
    1. title with tailing '.' is tricky to work with in splitted array
    2. It's easier to use RegEx to search for the time string.
  */
  if (targetLocale === 'british') {
    // preprocess time
    processedSentence = translateTime(sentence, 'british', translatedWords);
    // preprocess title
    Object.entries(aToBTitles).forEach(([americanTitle, britishTitle]) => {
      const regex = createRegex(americanTitle, 'g');
      processedSentence = processedSentence.replace(regex, () => {
        translatedWords.push(britishTitle);
        return britishTitle;
      });
    });
  }
  if (targetLocale === 'american') {
    // preprocess time
    processedSentence = translateTime(sentence, 'american', translatedWords);
    // preprocess title
    Object.entries(bToATitles).forEach(([britishTitle, americanTitle]) => {
      const regex = createRegex(britishTitle, 'g');
      processedSentence = processedSentence.replace(regex, () => {
        translatedWords.push(americanTitle);
        return americanTitle;
      });
    });
  }

  const translation = Object.keys(dict).reduce((str, key) => {
    const regex = createRegex(key, 'gi');

    return str.replace(regex, (match) => {
      // This only runs when there is a match
      const mappedTo = dict[match.toLowerCase()];
      const translated = isCapitalized(match) ? capitalize(mappedTo) : mappedTo;
      translatedWords.push(translated);
      return translated;
    });
  }, processedSentence);

  return {
    translation,
    translatedWords,
  };
};

const convertToHTML = (string, translatedWords) => {
  const words = [...new Set(translatedWords)];
  return words.reduce((str, translatedWord) => {
    const pattern = createRegex(translatedWord, 'g');
    return str.replace(
      pattern,
      `<span class="highlight">${translatedWord}</span>`
    );
  }, string);
};

// Enclosing character class with capturing group will include delimiters in the resulting array.
// const splittedSentence = processedSentence.split(/([\s.,!?;:])/);
const clearOutput = () => {
  outputDiv.innerHTML = '';
  errorDiv.innerHTML = '';
};

const clearInput = () => {
  textArea.value = '';
};

const handleTranslateClick = () => {
  const inputString = textArea.value;
  const targetLocale =
    localeSelect.value === 'american-to-british' ? 'british' : 'american';

  // clear current output and error message before showing new result
  clearOutput();

  if (!inputString.trim()) {
    errorDiv.innerText = 'Error: No text to translate.';
    return;
  }
  const { translation, translatedWords } = translate(inputString, targetLocale);

  const translationHTML = convertToHTML(translation, translatedWords);
  if (translatedWords.length === 0) {
    outputDiv.innerText = 'Everything looks good to me!';
    return;
  }

  outputDiv.innerHTML = translationHTML;
};

translateButton.addEventListener('click', handleTranslateClick);

clearButton.addEventListener('click', () => {
  clearInput();
  clearOutput();
});

/* 
  Export your functions for testing in Node.
  Note: The `try` block is to prevent errors on
  the client side
*/
try {
  module.exports = {
    translate,
  };
} catch (e) {}
