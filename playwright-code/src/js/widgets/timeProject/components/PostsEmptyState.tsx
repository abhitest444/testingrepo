import React, { useCallback } from 'react';
import { H5, B3 } from '@ids-ts/typography';
import Button from '@ids-ts/button';
import { useIntl } from '@payroll/quicksand';
import {
  ZeroStateContainer,
  ZeroStateTitle,
  ZeroStateDescription,
} from './ProjectSummary.styled';

interface PostsEmptyStateProps {
  /**
   * Fired when the user clicks "Create post". Optional for now — the
   * composer drawer lands in a follow-up story, so the button is a no-op
   * until a handler is wired in.
   */
  onCreatePost?: () => void;
}

/**
 * Zero state for the Posts tab — shown when a project has no posts yet.
 * Mirrors the Estimates-tab zero state (same centered title / description
 * / primary CTA treatment) by reusing the shared ZeroState* styled
 * components.
 */
const PostsEmptyState: React.FC<PostsEmptyStateProps> = ({ onCreatePost }) => {
  const intl = useIntl();
  const text = useCallback((id: string) => intl.formatMessage({ id }), [intl]);

  return (
    <ZeroStateContainer data-testid="project-posts-zero-state">
      <ZeroStateTitle>
        <H5 weight="demi">{text('timeProject.posts.zeroState.title')}</H5>
      </ZeroStateTitle>
      <ZeroStateDescription>
        <B3>{text('timeProject.posts.zeroState.description')}</B3>
      </ZeroStateDescription>
      <Button
        priority="primary"
        purpose="standard"
        onClick={onCreatePost}
        data-testid="project-posts-create-post-btn"
      >
        {text('timeProject.posts.zeroState.createPost')}
      </Button>
    </ZeroStateContainer>
  );
};

export default PostsEmptyState;
