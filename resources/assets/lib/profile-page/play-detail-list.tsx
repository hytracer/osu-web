// Copyright (c) ppy Pty Ltd <contact@ppy.sh>. Licensed under the GNU Affero General Public License v3.0.
// See the LICENCE file in the repository root for full licence text.

import ProfilePageExtraSectionTitle from 'components/profile-page-extra-section-title';
import ScoreJson from 'interfaces/score-json';
import { action, computed, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import ShowMoreLink from 'show-more-link';
import { ContainerContext, KeyContext } from 'stateful-activation-context';
import { classWithModifiers } from 'utils/css';
import Controller from './controller';
import { TopScoreSection } from './extra-page-props';
import PlayDetail from './play-detail';

type ScoreSections = TopScoreSection | 'scoresRecent';

const sectionMaps = {
  scoresBest: {
    countKey: 'scores_best_count',
    showPpWeight: true,
    translationKey: 'top_ranks.best',
  },
  scoresFirsts: {
    countKey: 'scores_first_count',
    translationKey: 'top_ranks.first',
  },
  scoresPinned: {
    countKey: 'scores_pinned_count',
    translationKey: 'top_ranks.pinned',
  },
  scoresRecent: {
    countKey: 'scores_recent_count',
    translationKey: 'historical.recent_plays',
  },
} as const;

interface Props {
  controller: Controller;
  section: ScoreSections;
}

@observer
export default class PlayDetailList extends React.Component<Props> {
  @observable activeKey: number | null = null;
  private readonly containerContextValue: {
    activeKeyDidChange: (key: number | null) => void;
  };

  @computed
  private get paginatorJson() {
    return this.props.controller.paginatorJson(this.props.section);
  }

  @computed
  private get uniqueItems() {
    if (!Array.isArray(this.paginatorJson.items)) return [];

    const ret = new Map<number, ScoreJson>();
    this.paginatorJson.items.forEach((item) => ret.set(item.id, item));

    return [...ret.values()];
  }

  constructor(props: Props) {
    super(props);

    makeObservable(this);

    // Do this after makeObservable call to make sure it's the decorated version of the function.
    this.containerContextValue = { activeKeyDidChange: this.activeKeyDidChange };
  }

  render() {
    if (!Array.isArray(this.paginatorJson.items)) {
      return <p>{this.paginatorJson.items.error}</p>;
    }

    const sectionMap = sectionMaps[this.props.section];
    const showPpWeight = 'showPpWeight' in sectionMap && sectionMap.showPpWeight;

    return (
      <>
        <ProfilePageExtraSectionTitle
          count={this.props.controller.state.user[sectionMap.countKey]}
          titleKey={`users.show.extra.${sectionMap.translationKey}.title`}
        />

        <ContainerContext.Provider value={this.containerContextValue}>
          <div className={classWithModifiers('play-detail-list', { 'menu-active': this.activeKey != null })}>
            {(this.uniqueItems).map((score) => (
              <KeyContext.Provider key={score.id} value={score.id}>
                <PlayDetail
                  activated={this.activeKey === score.id}
                  score={score}
                  showPpWeight={showPpWeight}
                />
              </KeyContext.Provider>
            ))}
          </div>
        </ContainerContext.Provider>

        <ShowMoreLink
          {...this.paginatorJson.pagination}
          callback={this.onShowMore}
          data={this.props.section}
          modifiers='profile-page'
        />
      </>
    );
  }

  @action
  private activeKeyDidChange = (key: number | null) => {
    this.activeKey = key;
  };

  private onShowMore = () => {
    this.props.controller.apiShowMore(this.props.section);
  };
}