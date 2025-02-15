import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";

import {
  getSortedAndFilteredAppCommentThreadIds,
  applicationCommentsSelector,
  allCommentThreadsMap,
  getAppCommentThreads,
  shouldShowResolved as shouldShowResolvedSelector,
  appCommentsFilter as appCommentsFilterSelector,
} from "selectors/commentsSelectors";
import { getCurrentApplicationId } from "selectors/editorSelectors";

import CommentThread from "comments/CommentThread/connectedCommentThread";
import AppCommentsPlaceholder from "./AppCommentsPlaceholder";
import { getCurrentUser } from "selectors/usersSelectors";

import { Virtuoso } from "react-virtuoso";
import { setShouldShowResolvedComments } from "actions/commentActions";
import { useSelectCommentThreadUsingQuery } from "../inlineComments/Comments";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import { COMMENT_HAS_BEEN_DELETED, createMessage } from "constants/messages";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: auto;
`;

function AppCommentThreads() {
  const dispatch = useDispatch();
  const commentThreadIdFromUrl = useSelectCommentThreadUsingQuery();
  const applicationId = useSelector(getCurrentApplicationId) as string;
  const appCommentThreadsByRefMap = useSelector(
    applicationCommentsSelector(applicationId),
  );
  const appCommentThreadIds = getAppCommentThreads(appCommentThreadsByRefMap);
  const commentThreadsMap = useSelector(allCommentThreadsMap);
  const shouldShowResolved = useSelector(shouldShowResolvedSelector);
  const appCommentsFilter = useSelector(appCommentsFilterSelector);

  const currentUser = useSelector(getCurrentUser);
  const currentUsername = currentUser?.username;

  const commentThreadIds = useMemo(
    () =>
      getSortedAndFilteredAppCommentThreadIds(
        appCommentThreadIds,
        commentThreadsMap,
        shouldShowResolved,
        appCommentsFilter,
        currentUsername,
      ),
    [
      appCommentThreadIds,
      commentThreadsMap,
      shouldShowResolved,
      appCommentsFilter,
      currentUsername,
    ],
  );

  useEffect(() => {
    // if user is visiting a comment thread link which is already resolved,
    // we'll activate the resolved comments filter
    if (
      commentThreadIdFromUrl &&
      !commentThreadIds.includes(commentThreadIdFromUrl)
    ) {
      if (appCommentThreadIds.includes(commentThreadIdFromUrl))
        dispatch(setShouldShowResolvedComments(true));
      else
        Toaster.show({
          text: createMessage(COMMENT_HAS_BEEN_DELETED),
          variant: Variant.warning,
        });
    }
  }, [commentThreadIdFromUrl]);

  return (
    <Container>
      {commentThreadIds.length > 0 && (
        <Virtuoso
          data={commentThreadIds}
          itemContent={(_index, commentThreadId) => (
            /** Keeping this as a fail safe: since zero
             * height elements throw an error
             * */
            <div style={{ minHeight: 1 }}>
              <CommentThread
                commentThreadId={commentThreadId}
                hideChildren
                hideInput
                key={commentThreadId}
                showSubheader
              />
            </div>
          )}
        />
      )}
      {commentThreadIds.length === 0 && <AppCommentsPlaceholder />}
    </Container>
  );
}

export default AppCommentThreads;
