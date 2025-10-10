import React from 'react';
import { classes, compile } from 'core/js/reactHelpers';

export default function SubmitAll (props) {
  const {
    buttonText,
    ariaLabel,
    onSubmitAllButtonClicked
  } = props;

  return (
    <div className='btn__container'>
      <div className='btn__response-container'>

        <button
          className={classes([
            'btn-text',
            'btn__action',
            'js-btn-action',
            'is-disabled'
          ])}
          aria-label={ariaLabel}
          aria-disabled='true'
          onClick={onSubmitAllButtonClicked}
          dangerouslySetInnerHTML={{ __html: compile(buttonText) }}
        />

      </div>
    </div>
  );
}
