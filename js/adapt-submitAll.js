import Adapt from 'core/js/adapt';
import SubmitAllView from './SubmitAllView';

class SubmitAll extends Backbone.Controller {
  initialize() {
    this.listenTo(Adapt, 'articleView:postRender', this.initSubmitAll);
  }

  initSubmitAll(view) {
    const saData = view.model.get('_submitAll');
    if (!saData || !saData._isEnabled) return;

    const model = new Backbone.Model({
      ...saData,
      _isSubmitted: false,
      _articleView: view,
      _componentViews: []
    });

    new SubmitAllView({ model });
  }
}

export default new SubmitAll();
