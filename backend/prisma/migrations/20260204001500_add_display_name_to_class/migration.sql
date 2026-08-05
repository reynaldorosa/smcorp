-- AddColumn
ALTER TABLE "classes" ADD COLUMN "display_name" TEXT;

-- AddComment
COMMENT ON COLUMN "classes"."display_name" IS 'Nome personalizado para exibição. Se NULL, usa course.name';
