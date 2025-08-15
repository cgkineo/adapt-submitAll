import Adapt from 'core/js/adapt';
import React from 'react';
import ReactDOM from 'react-dom';
import { templates } from 'core/js/reactHelpers';

export default class SubmitAllView extends Backbone.View {

  className() {
    return 'submit-all';
  }

  initialize({ articleView }) {
    _.bindAll(this, 'onInteraction', 'onSubmitAllButtonClicked', 'postRender');
    this.listenTo(Adapt, {
      'componentView:postRender': this.onComponentViewRendered,
      remove: this.onRemove
    });
    this.articleView = articleView;
    this.componentViews = [];
    this.render();
  }

  render() {
    this.articleView.$el.addClass('no-submit-buttons');
    const buttons = this.model.get('_button');
    const courseSubmitButtons = Adapt.course.get('_buttons')._submit;
    const buttonText = buttons.buttonText || courseSubmitButtons.buttonText;
    const ariaLabel = buttons.ariaLabel || courseSubmitButtons.ariaLabel;
    const data = {
      ...this,
      model: this.model.toJSON(),
      buttonText,
      ariaLabel
    };
    ReactDOM.render(<templates.submitAll {...data} />, this.el);
    _.defer(this.postRender);
    this.appendToContainerDiv();
    return this;
  }

  appendToContainerDiv() {
    const $article = this.articleView.$el;
    const $lastBlock = $article.find('.block').last();
    const specifiedBlockId = this.model.get('_insertAfterBlock');
    const $specifiedBlock = specifiedBlockId && $article.find('.' + specifiedBlockId);
    const $containerDiv = $specifiedBlock.length
      ? $specifiedBlock
      : $lastBlock;
    $containerDiv.after(this.$el);
  }

  postRender() {
    Adapt.trigger('view:render', this);
    this.listenTo(Adapt, 'drawer:closed', this.remove);
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
    const isInArticle = (view.model.findAncestor('article').get('_id') !== this.articleView.model.get('_id'));
    if (isInArticle) return;
    this.componentViews.push(view);
    if (view.model.get('_component') === 'textinput') {
      view.$el.find('input').on('change.submitAll', this.onInteraction);
      return;
    }
    view.$el.on('click.submitAll', this.onInteraction);
  }

  onInteraction() {
    // need to wait until current call stack's done in FF
    _.defer(() => {
      if (this.model.get('_isSubmitted')) return;
      this.enableSubmitAllButton(this.canSubmit());
    });
  }

  enableSubmitAllButton(enable) {
    const $submitAllButton = this.$el.find('.js-btn-action');
    $submitAllButton
      .toggleClass('is-disabled', !enable)
      .attr('aria-disabled', !enable);
  }

  /**
    * Checks all the questions in the article to see if they're all ready to be submitted or not
    * @return {boolean}
    */
  canSubmit() {
    const areAllAnswered = this.componentViews.every(component =>
      component.model.get('_isEnabled') &&
      component.model.canSubmit()
    );
    return areAllAnswered;
  }

  onSubmitAllButtonClicked() {
    this.componentViews.forEach(view => view.$el.find('.js-btn-action').trigger('click'));
    this.enableSubmitAllButton(false);
    this.model.set('_isSubmitted', true);
    Adapt.trigger('submitAll:submitted', this.componentViews);
  }

  onRemove() {
    this.removeEventListeners();
    this.remove();
  }

  removeEventListeners() {
    this.componentViews.forEach(view => {
      if (view.model.get('_component') === 'textinput') {
        view.$el.find('input').off('change.submitAll');
        return;
      }
      view.$el.off('click.submitAll');
    });
  }
}
