import Adapt from 'core/js/adapt';
import SubmitAllView from './SubmitAllView';

class SubmitAll extends Backbone.Controller {
  initialize() {
    this.listenTo(Adapt, 'articleView:postRender', this.onArticlePostRender);
  }

  onArticlePostRender(view) {
    const config = view.model.get('_submitAll');
    if (!config?._isEnabled) return;
    const model = new Backbone.Model({
      ...config,
      _isSubmitted: false
    });
    new SubmitAllView({ model, articleView: view });
  }
}

export default new SubmitAll();
