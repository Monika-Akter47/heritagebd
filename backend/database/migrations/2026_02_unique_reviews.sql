-- Keep the oldest review for each user/listing pair before enforcing the new rule.
DELETE duplicate_review
FROM reviews duplicate_review
JOIN reviews original_review
  ON duplicate_review.user_id = original_review.user_id
 AND duplicate_review.target_type = original_review.target_type
 AND duplicate_review.target_id = original_review.target_id
 AND (
   duplicate_review.created_at > original_review.created_at
   OR (duplicate_review.created_at = original_review.created_at AND duplicate_review.id > original_review.id)
 );

ALTER TABLE reviews
  ADD UNIQUE KEY uniq_user_target_review (user_id, target_type, target_id);
