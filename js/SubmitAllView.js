import Adapt from 'core/js/adapt';
import React from 'react';
import ReactDOM from 'react-dom';
import { templates } from 'core/js/reactHelpers';

export default class SubmitAllView extends Backbone.View {

  className() {
    return 'submit-all';
  }

  initialize() {
    this.onSubmitAllButtonClicked = this.onSubmitAllButtonClicked.bind(this);

    this.model.get('_articleView').$el.addClass('no-submit-buttons');

    this.listenTo(Adapt, {
        'componentView:postRender': this.onComponentViewRendered,
        remove: () => {
            this.removeEventListeners();
            this.remove();
        }
    });

    _.bindAll(this, 'onInteraction', '_onInteractionDelegate');

    this.render();
  }

  render() {
    const submitButtonLabels = Adapt.course.get('_buttons')._submit;

    const data = {
      ...this,
      model: this.model.toJSON(),
      buttonText: submitButtonLabels.buttonText,
      ariaLabel: submitButtonLabels.ariaLabel
    };

    ReactDOM.render(<templates.submitAll {...data} />, this.el);

    _.defer(() => {
      Adapt.trigger('view:render', this);
      this.listenTo(Adapt, 'drawer:closed', this.remove);
    });

    const $containerDiv = this.getContainerDiv(this.model.get('_articleView').$el, this.model.get('_insertAfterBlock'));
    $containerDiv.after(this.$el);

    return this;
  }

  /**
    * Returns a reference to the `<div>` we're going to append our view to.
    * @param {jQuery} $article JQuery reference to the article we're attached to
    * @param {string} [blockId] The id of the block to append our view to. Must be in the article we're attached to...
    * @return {jQuery}
    */
  getContainerDiv($article, blockId) {
    if (blockId) {
      const $div = $article.find('.' + blockId);

      if ($div.length > 0) return $div;
    }

    return $article.find('.block').last();
  }

  enableSubmitAllButton(enable) {
    const $submitAllButton = this.$el.find('.js-btn-action');

    if (enable) {
      $submitAllButton.removeClass('is-disabled').attr('aria-disabled', false);

      return;
    }

    $submitAllButton.addClass('is-disabled').attr('aria-disabled', true);
  }

  /**
    * Checks all the questions in the article to see if they're all ready to be submitted or not
    * @return {boolean}
    */
  canSubmit() {
    const allAnswered = this.model.get('_componentViews').every(component => component.model.get('_isEnabled') && component.model.canSubmit());
    
    return allAnswered;
  }

  removeEventListeners() {
    this.model.get('_componentViews').forEach(view => {
      if (view.model.get('_component') === 'textinput') {
        view.$el.find('input').off('change.submitAll');

        return;
      }

      view.$el.off('click.submitAll');
    });
  }

  /**
    * Checks the view to see if it is:
    * a) a question component
    * b) a child of the article we're attached to
    * And, if it is, add it to the list and listen out for the learner interacting with it
    * @param {Backbone.View} view
    */
  onComponentViewRendered(view) {
    if (!view.$el.hasClass('is-question')) return;

    const parentArticleId = view.model.findAncestor('article').get('_id');
    const submitAllArticleId = this.model.get('_articleView').model.get('_id');
    if (parentArticleId !== submitAllArticleId) return;

    this.model.get('_componentViews').push(view);

    if (view.model.get('_component') === 'textinput') {
      view.$el.find('input').on('change.submitAll', this.onInteraction);

      return;
    }

    view.$el.on('click.submitAll', this.onInteraction);
  }

  onInteraction() {
    // need to wait until current call stack's done in FF
    _.defer(this._onInteractionDelegate);
  }

  _onInteractionDelegate() {
    if (this.model.get('_isSubmitted')) return;

    this.enableSubmitAllButton(this.canSubmit());
  }

  onSubmitAllButtonClicked() {
    this.model.get('_componentViews').forEach(view => view.$el.find('.js-btn-action').trigger('click'));

    this.enableSubmitAllButton(false);

    this.model.set('_isSubmitted', true);

    Adapt.trigger('submitAll:submitted', this.model.get('_componentViews'));
  }
}
