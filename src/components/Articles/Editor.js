/**
 * ### Редактор статьи
 * Форма элемента справочника cat.articles
 *
 * @module Editor
 *
 * Created by Evgeniy Malyarov on 20.04.2018.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Helmet from 'react-helmet';
import FormGroup from '@material-ui/core/FormGroup';

import MDNRComponent from 'metadata-react/common/MDNRComponent';
import LoadingMessage from 'metadata-react/DumbLoader/LoadingMessage';
import DataObjToolbar from 'metadata-react/FrmObj/DataObjToolbar';
import FrmAttachments from 'metadata-react/FrmAttachments';
import DataField from 'metadata-react/DataField';
import MarkdownDocs from 'metadata-react/Markdown/MarkdownDocs';
import Dialog from 'metadata-react/App/Dialog';
import SelectTags from 'metadata-react/DataField/SelectTags';
import Social from './Social';
import AclList from './AclList';

import IconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';
import IconList from '@material-ui/icons/List';

import withStyles from 'metadata-react/styles/paper600';
import {withIface} from 'metadata-redux';

const htitle = 'Редактор материала';

class EditorArticle extends MDNRComponent {

  static propTypes = {
    _mgr: PropTypes.object,             // DataManager, с которым будет связан компонент
    _acl: PropTypes.string,             // Права на чтение-изменение
    _meta: PropTypes.object,            // Здесь можно переопределить метаданные
    _layout: PropTypes.object,          // Состав и расположение полей, если не задано - рисуем типовую форму

    read_only: PropTypes.object,        // Элемент только для чтения

    handlers: PropTypes.object.isRequired, // обработчики редактирования объекта
  };

  constructor(props, context) {
    super(props, context);
    const {_mgr, _meta} = props;
    this._handlers = {
      handleSave: this.handleSave.bind(this),
      handleClose: this.handleClose.bind(this),
      handleMarkDeleted: this.handleMarkDeleted.bind(this),
    };
    this.state = {
      _meta: _meta || _mgr.metadata(),
      _obj: null,
      MarkdownInput: () => null,
      TabularSection: () => null,
      index: 0,
      synonyms: false,
      acl_att: false,
    };
    // в редакторе доступны все категории
    this.tagList = [];
    $p.cat.tags.forEach((tag) => {
      this.tagList.push(tag);
    });
  }

  componentDidMount() {
    const {_mgr, match} = this.props;
    _mgr.get(match.params.ref, 'promise').then((_obj) => {
      this.setState({_obj}, () => this.shouldComponentUpdate(this.props));
    });
    // отложенная загрузка тяжелых компонентов табличной части и MarkdownInput
    Promise.all([
      import('@opuscapita/react-markdown'),
      import(/* webpackChunkName: "metadata-react" */ 'metadata-react/TabularSection'),
    ])
      .then((modules) => {
        this.setState({
          MarkdownInput: modules[0].default,
          TabularSection: modules[1].default,
        });
      });

    _mgr.on('update', this.onDataChange);
  }

  componentWillUnmount() {
    this.props._mgr.off('update', this.onDataChange);
  }

  /* eslint-disable-next-line*/
  onDataChange = (obj, fields) => {
    if(obj === this.state._obj) {
      this.shouldComponentUpdate(this.props);
    }
  }

  handleSave() {
    //this.props.handleSave(this.state._obj);
    const {_obj} = this.state;
    _obj && _obj.save()
      .then(() => this.shouldComponentUpdate(this.props))
      .catch((err) => {
        // показываем диалог
        this.props.handleIfaceState({
          component: '',
          name: 'alert',
          value: {open: true, title: _obj.presentation, text: err.reason || err.message}
        });
      });
  }

  handleMarkDeleted() {

  }

  handleClose() {
    const {handlers, _mgr} = this.props;
    const {_obj} = this.state;
    handlers.handleNavigate(`/${_mgr.class_name}/list${_obj ? '/?ref=' + _obj.ref : ''}`);
  }

  handleMouseDown(event) {
    event.preventDefault();
  }

  handleValueChange(_fld) {
    return (event, value) => {
      const {_obj, handlers} = this.props;
      const old_value = _obj[_fld];
      _obj[_fld] = (value || (event && event.target ? event.target.value : ''));
      handlers.handleValueChange(_fld, old_value);
    };
  }

  handleOpenSynonyms = () => {
    this.setState({synonyms: true});
  };

  handleCloseSynonyms = () => {
    this.setState({synonyms: false});
  };

  handleOpenAclAtt = () => {
    this.setState({acl_att: true});
  };

  handleCloseAclAtt = () => {
    this.setState({acl_att: false});
  };

  get ltitle() {
    const {_meta, _obj} = this.state;
    let ltitle = (_obj && _obj.presentation) || _meta.obj_presentation || _meta.synonym;
    if(_obj && _obj._modified && ltitle[ltitle.length - 1] !== '*') {
      ltitle += ' *';
    }
    return ltitle;
  }

  editorStyles(el) {
    const content = el && el.querySelector('.react-markdown--slate-content');
    if(content) {
      content.style.minHeight = '140px';
    }
  }

  tagsChange = ({target}) => {
    const {state: {_obj}} = this;
    _obj.tags = target.value;
    _obj._modified = true;
    this.forceUpdate();
  };

  renderFields(_obj, classes) {
    const id = _obj._metadata('id');
    id.tooltip = 'Короткий человекочитаемый url статьи';
    id.synonym = 'Url';

    const show_version = _obj.tags.some((ref) => {
      const tag = $p.cat.tags.get(ref);
      return tag.category.predefined_name === 'file';
    });

    return (
      <FormGroup key="props" className={classes.spaceLeft}>
        <FormGroup row>
          <DataField _obj={_obj} _fld="date"/>
          <DataField _obj={_obj} _fld="author"/>
          <DataField _obj={_obj} _fld="published"/>
        </FormGroup>
        <FormGroup row>
          <DataField _obj={_obj} _fld="id" _meta={id} InputProps={{
            endAdornment: (
              <InputAdornment position="end" title="Альтернативные url">
                <IconButton
                  onClick={this.handleOpenSynonyms}
                  onMouseDown={this.handleMouseDown}
                >
                  <IconList />
                </IconButton>
              </InputAdornment>
            )
          }}/>
          <DataField _obj={_obj} _fld="sorting_field"/>
          <DataField _obj={_obj} _fld="img" />
        </FormGroup>
        <FormGroup row>
          <DataField _obj={_obj} _fld="contents" tree/>
          <SelectTags tags={_obj.tags} categories tagList={this.tagList} handleChange={this.tagsChange}/>
          <AclList
            _obj={_obj}
            endAdornment={
              <InputAdornment position="end" title="ACL вложений">
                <IconButton
                  onClick={this.handleOpenAclAtt}
                  onMouseDown={this.handleMouseDown}
                >
                  <IconList />
                </IconButton>
              </InputAdornment>
            }
          />
        </FormGroup>
        <DataField _obj={_obj} _fld="name" fullWidth/>
        <DataField _obj={_obj} _fld="h1" fullWidth/>
        <DataField _obj={_obj} _fld="descr" fullWidth multiline rowsMax="3"/>
        <DataField _obj={_obj} _fld="introduction" fullWidth multiline rowsMax="4"/>
        {
          show_version && <FormGroup row>
            <DataField _obj={_obj} _fld="version_from"/>
            <DataField _obj={_obj} _fld="version_till"/>
          </FormGroup>
        }
        <DataField _obj={_obj} _fld="formula" fullWidth/>

      </FormGroup>
    );
  }

  render() {
    const {
      props: {_mgr, classes, handleIfaceState},
      state: {_obj, _meta, index, MarkdownInput, TabularSection, synonyms, acl_att},
      context, _handlers} = this;
    const toolbar_props = Object.assign({
      closeButton: !context.dnr,
      posted: _obj && _obj.posted,
      deleted: _obj && _obj.deleted,
      postable: !!(_meta.posted || _mgr.metadata('posted')),
      deletable: false,
    }, _handlers);

    return _obj ? [
      <Helmet key="helmet" title={htitle}>
        <meta name="description" content={htitle} />
        <meta property="og:title" content={htitle} />
        <meta property="og:description" content={htitle} />
      </Helmet>,

      <Tabs key="tabs" value={index} onChange={(event, index) => this.setState({index})}>
        <Tab label="Реквизиты"/>
        <Tab label="Текст"/>
        <Tab label="Просмотр"/>
        <Tab label="Вложения"/>
      </Tabs>,

      index === 0 && <DataObjToolbar key="toolbar" {...toolbar_props} />,

      index === 0 && this.renderFields(_obj, classes),

      index === 1 && (
        MarkdownInput ?
          <div key="content" ref={this.editorStyles}>
            <MarkdownInput
              onChange={(val) => {
                _obj._obj.content = val;
                _obj._modified = true;
              }}
              value={_obj.content}
              autoFocus={false}
              readOnly={false}
              showFullScreenButton={false}
              hideToolbar
              locale='ru'
            />
          </div>
          :
          <LoadingMessage key="loading" />
      ),

      index === 2 &&
        <MarkdownDocs
        key="preview"
        htitle={this.ltitle}
        h1={_obj.h1}
        descr={_obj.descr}
        markdown={_obj.content}
        footer={<Social title={_obj.name}/>}
      />,

      index === 3 && <FrmAttachments key="attachments" _obj={_obj} handleIfaceState={handleIfaceState}/>,

      synonyms && (
        <Dialog
          key="aliases"
          open
          minheight
          title="Альтернативные url"
          onClose={this.handleCloseSynonyms}
        >
          <TabularSection _obj={_obj} _tabular="aliases"/>
        </Dialog>
      ),

      acl_att && (
        <Dialog
          key="acl_att"
          open
          minheight
          title="ACL вложений"
          onClose={this.handleCloseAclAtt}
        >
          <TabularSection _obj={_obj} _tabular="acl_att"/>
        </Dialog>
      ),

    ]
      :
      <LoadingMessage />;
  }
}

export default withStyles(withIface(EditorArticle));
