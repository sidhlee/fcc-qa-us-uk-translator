import { americanOnly } from './american-only.js';
import { britishOnly } from './british-only.js';
import { americanToBritishSpelling } from './american-to-british-spelling.js';
import { americanToBritishTitles } from './american-to-british-titles.js';

const reverseDict = (dict) => {
  return Object.keys(dict).reduce((newDict, key) => {
    newDict[dict[key]] = key;
    return newDict;
  }, {});
};

let americanToBritishDict = { ...americanToBritishSpelling, ...americanOnly };

const britishToAmericanSpelling = reverseDict({ ...americanToBritishDict });
let britishToAmericanDict = { ...britishToAmericanSpelling, ...britishOnly };

let britishToAmericanTitles = reverseDict({ ...americanToBritishTitles });

/**
 * Return a new object augmenting passed titleDict with capitalized keys
 * @param {Object} titleDict
 */
const capitalizeTitlesDict = (titleDict) => {
  return Object.keys(titleDict).reduce((newDict, title) => {
    const capitalizedTitle = title[0].toUpperCase() + title.slice(1);

    // americanToBritishTitles: Mr. => Mr
    // britishToAmericanTitles: Mr => Mr.
    titleDict[capitalizedTitle] =
      capitalizedTitle.slice(-1) === '.'
        ? capitalizedTitle.replace('.', '')
        : `${capitalizedTitle}.`;

    return newDict;
  }, {});
};

// Include both capitalized and lowercase title
const upLowAmericanToBritishTitles = {
  ...americanToBritishTitles,
  ...capitalizeTitlesDict(americanToBritishTitles),
};
const upLowBritishToAmericanTitles = {
  ...britishToAmericanTitles,
  ...capitalizeTitlesDict(britishToAmericanTitles),
};

// Get UI elements
const textArea = document.getElementById('text-input');
const translationDiv = document.getElementById('translated-sentence');
const errorDiv = document.getElementById('error-msg');

// Clear all display
const clearAll = () => {
  return (
    (textArea.value = ''),
    (translationDiv.textContent = ''),
    (errorDiv.textContent = '')
  );
};

// Main translation function
const translateSentence = (inputString, targetLocale) => {
  const translatedWordsOrTerms = [];
  // set target titles based on targetLocale
  const targetTitles =
    targetLocale === 'british'
      ? upLowAmericanToBritishTitles
      : upLowBritishToAmericanTitles;

  // Replace title with the translated version in the given string.
  const replaceTitles = (str) => {
    return str
      .split(' ')
      .map((word) => {
        // Find the word in the targetTitles dictionary
        const targetTitle = targetTitles[word];
        // If it is valid title, convert it
        if (targetTitle) {
          translatedWordsOrTerms.push(targetTitle);
          return targetTitle;
        } else {
          return word;
        }
      })
      .join(' ');
  };

  /**
   * Convert time separator between two numbers into the other locale
   * @param {string[]} arr Input array of splitted words and non-word characters(, . ; : ? !)
   * @returns {string[]} Output array where '5',':',"05" is replaced with "5.05"
   */
  const fixTimes = (arr) =>
    // 'at 11:25' today will be ['at', ' ', '11', ':', '25', ' ', 'today']
    arr.reduce((newArr, item, i, arr) => {
      // this pattern will match minutes section of 4:05
      const pattern = /^[\d]{1,2}$/;
      const currNumber = pattern.test(item) ? item : false;

      const isNextItemSeparator =
        targetLocale === 'british' ? arr[i + 1] === ':' : arr[i + 1] === '.';
      const followingItem = arr[i + 2];
      const followingNumber = pattern.test(followingItem)
        ? followingItem
        : false;
      // This will catch [...,'4', ':', '05',...] at the index of '4'
      if (currNumber && isNextItemSeparator && followingNumber) {
        const time =
          targetLocale === 'british'
            ? `${currNumber}.${followingNumber}`
            : `${currNumber}:${followingNumber}`;
        // '4.05' will be inserted in place of "4"
        newArr.push(time);

        translatedWordsOrTerms.push(time);
        // Remove ':' and '05'
        arr.splice(i + 1, 2);
      } else {
        // If the current item is not the beginning of the time string, leave it as is
        newArr.push(item);
      }

      return newArr;
    }, []);

  const titleReplacedStr = replaceTitles(inputString);

  const splitPattern = /([\s,.;:?!])/;
  const nonWordPattern = /[,.;?!]/g;
  /**
   * Splits sentences into words, spaces, and non-letter characters.
   */
  let splittedTitleReplacedStr = titleReplacedStr
    .split(splitPattern) // pattern inside capture-group will be included in the result
    .filter((el) => el !== ''); // remove empty strings between delimiters sitting next to each other

  const lowerStrArr = titleReplacedStr
    .toLowerCase()
    .split(splitPattern)
    .filter((el) => el !== '');

  const targetDict = // contains mapping for spelling and vocabulary (not title or time)
    targetLocale === 'british' ? americanToBritishDict : britishToAmericanDict;

  const titleAndTimeFixedArr = fixTimes(splittedTitleReplacedStr);
  const titleAndTimeFixedLowerArr = fixTimes(lowerStrArr);

  // Iterate through the target dictionary containing spelling and words/terms
  Object.keys(targetDict).forEach((wordOrTermInDict) => {
    // Remove non-letter characters to test for words/terms
    const wordsOnlyStr = titleAndTimeFixedLowerArr
      .join('')
      .replace(nonWordPattern, '');

    // Check whole string to handle terms that have more than 2 words
    if (wordsOnlyStr.includes(wordOrTermInDict)) {
      const outputWordOrTerm = targetDict[wordOrTermInDict];
      const wordOrTermInDictArr = wordOrTermInDict.split(/(\s)/); // split word|term into words and space

      const isIncludedInTitleAndTimeFixedLowerArr = (str) =>
        titleAndTimeFixedLowerArr.indexOf(str) >= 0;

      /* 
        Check that the whole word or term from the dictionary is
        in the original string array, (eg. 'parking lot', not just 'parking')
        Store changes to titleAndTimeFixedArr and titleAndTimeFixedLowerArr
      */
      if (wordOrTermInDictArr.every(isIncludedInTitleAndTimeFixedLowerArr)) {
        // If a single word
        if (wordOrTermInDictArr.length === 1) {
          const wordOrTermIndex = titleAndTimeFixedLowerArr.indexOf(
            wordOrTermInDict
          );
          titleAndTimeFixedArr[wordOrTermIndex] = outputWordOrTerm;
          titleAndTimeFixedLowerArr[wordOrTermIndex] = outputWordOrTerm;

          translatedWordsOrTerms.push(outputWordOrTerm);
        } else {
          // If term with more than 2 words (arr includes an empty space between words)

          // Find the index of inputArr where the word matches the first word from the dict key
          // and next word (after the " ") matches the next word from the dict key,...and so on.
          const targetIndex = titleAndTimeFixedLowerArr.findIndex(
            (titleAndTimeFixedLowerWord, i, arr) => {
              // Loop through all words in dict key
              for (let j = 0; j < wordOrTermInDictArr.length - 2; j++) {
                return (
                  // return index that meets this condition
                  // 1. looping word matches word from dict
                  titleAndTimeFixedLowerWord === wordOrTermInDictArr[j] &&
                  // 2. next word(after " ") matches next from dict
                  arr[i + 2] === wordOrTermInDictArr[j + 2]
                );
              }
            }
          );

          titleAndTimeFixedLowerArr.splice(
            targetIndex,
            wordOrTermInDictArr.length,
            outputWordOrTerm
          );
          // Handle cases where the original term was capitalized
          const firstWordOfTerm = titleAndTimeFixedArr.slice(
            targetIndex,
            targetIndex + wordOrTermInDictArr.length
          );
          const capitalTerm =
            firstWordOfTerm[0].toUpperCase() === firstWordOfTerm[0];
          titleAndTimeFixedArr.splice(
            targetIndex,
            wordOrTermInDictArr.length,
            capitalTerm
              ? outputWordOrTerm[0].toUpperCase() + outputWordOrTerm.slice(1)
              : outputWordOrTerm
          );

          translatedWordsOrTerms.push(outputWordOrTerm);
        }
      }
    }
  });

  // console.log(lowerStrArr, preservedCapsArr);

  const translatedStr = collapseSentenceArr(titleAndTimeFixedArr);
  const translationObj = {
    translatedStr: translatedStr,
    translatedStrArr: titleAndTimeFixedArr,
    translatedWordsOrTerms: translatedWordsOrTerms,
  };

  // console.log(translationObj);
  displayTranslation(translationObj);
  return translationObj;
};

const collapseSentenceArr = (arr) => {
  return arr.reduce((acc, curr) => {
    return (acc += curr);
  }, '');
};

const displayTranslation = (obj) => {
  const { translatedStr, translatedStrArr, translatedWordsOrTerms } = obj;

  translatedWordsOrTerms.forEach((wordOrTerm) => {
    // Handle cases where the capitalization of a translated word
    // or term might be upper or lowercase
    const upperWordOrTerm = wordOrTerm[0].toUpperCase() + wordOrTerm.slice(1);
    // console.log(upperWordOrTerm, obj);
    if (translatedStrArr.indexOf(upperWordOrTerm) >= 0) {
      translatedStrArr[
        translatedStrArr.indexOf(upperWordOrTerm)
      ] = `<span class='highlight'>${upperWordOrTerm}</span>`;
    } else {
      translatedStrArr[
        translatedStrArr.indexOf(wordOrTerm)
      ] = `<span class='highlight'>${wordOrTerm}</span>`;
    }
  });

  const htmlStr = collapseSentenceArr(translatedStrArr);

  if (translatedStr === '' || textArea.value === '') {
    translationDiv.textContent = '';
    errorDiv.textContent = 'Error: No text to translate.';
  } else {
    errorDiv.textContent = '';
    return translatedWordsOrTerms.length === 0
      ? (translationDiv.innerHTML = 'Everything looks good to me!')
      : (translationDiv.innerHTML = htmlStr);
  }
};

// Handle buttons
const translateBtn = document.getElementById('translate-btn');
translateBtn.addEventListener('click', () => {
  const targetLocale =
    document.getElementById('locale-select').value === 'american-to-british'
      ? 'british'
      : 'american';
  translateSentence(textArea.value, targetLocale);
});

const clearBtn = document.getElementById('clear-btn');
clearBtn.addEventListener('click', () => {
  clearAll();
});

/* 
  Export your functions for testing in Node.
  Note: The `try` block is to prevent errors on
  the client side
*/
try {
  module.exports = {
    clearAll,
    translateSentence,
    displayTranslation,
  };
} catch (e) {}
