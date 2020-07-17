/*
 *
 *
 *       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
 *       -----[Keep the tests in the same order!]----
 *       (if additional are added, keep them at the very end!)
 */

const chai = require('chai');
const assert = chai.assert;

let Translator;

suite('Functional Tests', () => {
  suiteSetup(() => {
    // DOM already mocked -- load translator then run tests
    Translator = require('../public/translator.js');
  });

  suite('Function handleTranslateClick()', () => {
    /* 
      The translated sentence is appended to the `translated-sentence` `div`
      and the translated words or terms are wrapped in 
      `<span class="highlight">...</span>` tags when the "Translate" button is pressed.
    */
    test('Translation appended to the `translated-sentence` `div`', (done) => {
      const textArea = document.getElementById('text-input');
      const outputDiv = document.getElementById('translated-sentence');
      const outputHTML = `<span class="highlight">Dr</span> Strange's <span class="highlight">favourite</span> movie is starting at <span class="highlight">11.40</span> PM.`;

      textArea.value = `Dr. Strange's favorite movie is starting at 11:40 PM.`;
      Translator.handleTranslateClick();

      assert.strictEqual(outputDiv.innerHTML, outputHTML);
      done();
    });

    /* 
      If there are no words or terms that need to be translated,
      the message 'Everything looks good to me!' is appended to the
      `translated-sentence` `div` when the "Translate" button is pressed.
    */
    test("'Everything looks good to me!' message appended to the `translated-sentence` `div`", (done) => {
      const textArea = document.getElementById('text-input');
      const outputDiv = document.getElementById('translated-sentence');
      const message = 'Everything looks good to me!';

      textArea.value = 'True Colour';
      Translator.handleTranslateClick();
      console.log(outputDiv);
      assert.strictEqual(outputDiv.textContent, message);
      done();
    });

    /* 
      If the text area is empty when the "Translation" button is
      pressed, append the message 'Error: No text to translate.' to 
      the `error-msg` `div`.
    */
    test("'Error: No text to translate.' message appended to the `translated-sentence` `div`", (done) => {
      const textArea = document.getElementById('text-input');
      const errorDiv = document.getElementById('error-msg');

      const message = 'Error: No text to translate.';

      textArea.value = '';
      Translator.handleTranslateClick();

      assert.strictEqual(errorDiv.textContent, message);

      done();
    });
  });

  suite('Function clearAll()', () => {
    /* 
      The text area and both the `translated-sentence` and `error-msg`
      `divs` are cleared when the "Clear" button is pressed.
    */
    test('Text area, `translated-sentence`, and `error-msg` are cleared', (done) => {
      const textArea = document.getElementById('text-input');
      const outputDiv = document.getElementById('translated-sentence');
      const errorDiv = document.getElementById('error-msg');

      textArea.value = 'test';
      outputDiv.textContent = 'test';

      const clearButton = document.getElementById('clear-btn');
      clearButton.click();

      assert.strictEqual(textArea.value, '');
      assert.strictEqual(outputDiv.textContent, '');
      assert.strictEqual(errorDiv.textContent, '');
      done();
    });
  });
});
