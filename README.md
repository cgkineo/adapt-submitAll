# adapt-submitAll

**Submit All** is an *extension* that allows all questions in an article to be submitted in one go via a single submit button.

<img src="demo.gif" alt="Submit All in action"/>

The extension will hide the 'buttons' `<div>` for all the questions within the article. It will then append its own submit button after either the last block in the article or the one specified in `_insertAfterBlock`.

## Attributes

The following attributes are set within *articles.json*.

### **\_submitAll** (object)

The Submit All object. It contains the following settings:

#### **\_isEnabled** (boolean)

Turns on and off the extension.

#### **\_insertAfterBlock** (string)

If you want the submit button to be appended to a specific block within this article, insert the block ID here. Leave blank to default to the last block in the article.

#### **\_button** (object)

##### **buttonText** (string)

Sets the text that appears for the visual submit all button. The default value is `Submit all`.

##### **ariaLabel** (string)

Defines the text for the submit all button that is read out by screen readers. The default value is `Submit all`.

### Notes

- You should ensure that all questions within the article are set to 'do not show feedback' (either by setting `_canShowFeedback` to `false` on the individual question components or - if an assessment article - by setting `_questions._canShowFeedback` to `false` in the article's `_assessment` configuration). If you don't, all the feedback will be shown at once which is unlikely to be desirable...
- Since the standard button group for each question gets hidden, the user will have no way of accessing the 'correct answer' functionality.

----------------------------
**Author / maintainer:** Kineo<br>
**AAT support:** No<br>
**Accessibility support:** WAI AA<br>
**RTL support:** Yes<br>
**Cross-platform coverage:** Chrome, Chrome for Android, Firefox (ESR + latest version), Edge, Safari for macOS/iOS/iPadOS, Opera<br>
