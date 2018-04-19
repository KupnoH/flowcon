/**
 * Страница статьи
 *
 * @module Article
 *
 * Created by Evgeniy Malyarov on 17.04.2018.
 */

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import { CircularProgress } from 'material-ui/Progress';
import AppContent from 'metadata-react/App/AppContent';
import MarkdownDocs from 'metadata-react/Markdown/MarkdownDocs';
import NotFound from '../NotFound';  // 404
import Social from './Social';

class Article extends Component {

  state = {doc: null};

  componentDidMount() {
    const {ref} = this.props.match.params;
    $p.cat.articles.pouch_db.query('doc/number_doc', {
      key: ['cat.articles', 0, ref],
      limit: 1,
      include_docs: true,
    })
      .then((res) => {
        if(res.rows.length) {
          this.setState({doc: res.rows[0].doc});
        }
        else {
          this.setState({doc: 404});
        }
      })
      .catch((err) => {
        this.setState({doc: err});
      });
  }

  render() {
    const {doc} = this.state;
    if(!doc) {
      return <AppContent><CircularProgress size={24} /> Загрузка...</AppContent>;
    }
    else if(doc === 404) {
      return <NotFound />;
    }
    else if(doc instanceof Error) {
      return <NotFound />;
    }
    return (
      <MarkdownDocs
        key="doc"
        htitle={doc.name}
        h1={doc.h1}
        descr={doc.descr}
        markdown={doc.content}
        footer={<Social title={doc.name}/>}
      />
    );
  }
}

Article.propTypes = {
  match: PropTypes.object.isRequired,
};

export default Article;